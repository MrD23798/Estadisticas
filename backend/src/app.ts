import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { config } from './config';
import { initializeDatabase, closeDatabase, checkDatabaseHealth, getDatabaseInfo } from './config/database';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/routers';

// --- ¡YA NO NECESITAS IMPORTAR LAS RUTAS REST ANTIGUAS! ---
// import { estadisticasRoutes } from './routes/estadisticas.routes'; // <-- ELIMINADO
// import { legacyStatsRoutes } from './routes/legacy-stats.routes'; // <-- ELIMINADO
// import adminRoutes from './routes/admin.routes'; // <-- ELIMINADO

export async function buildApp(): Promise<FastifyInstance> {
  // Crear instancia de Fastify
  const app = Fastify({
    logger: config.app.environment === 'development' ? {
      level: config.app.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    } : {
      level: config.app.logLevel,
    },
    bodyLimit: parseInt(config.app.maxRequestSize.replace('mb', '')) * 1024 * 1024,
  });

  // Registrar plugins de seguridad
  await app.register(helmet, {
    contentSecurityPolicy: false, // Permitir tRPC playground en desarrollo
  });

  await app.register(compress, {
    global: true,
  });

  // Configurar CORS
  await app.register(cors, {
    origin: config.server.cors.origin,
    credentials: config.server.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
  });

  // Inicializar base de datos
  await initializeDatabase();

  // --- REGISTRAR EL PLUGIN DE TRPC ---
  await app.register(fastifyTRPCPlugin, {
    prefix: config.trpc.endpoint, // '/trpc'
    trpcOptions: { 
      router: appRouter, 
      createContext 
    },
  });
  // --- FIN REGISTRO TRPC ---

  // --- ¡YA NO NECESITAS REGISTRAR LAS RUTAS REST ANTIGUAS! ---
  // await app.register(estadisticasRoutes, { prefix: '/api' }); // <-- ELIMINADO
  // await app.register(legacyStatsRoutes, { prefix: '/api' }); // <-- ELIMINADO
  // await app.register(adminRoutes, { prefix: '/api/admin' }); // <-- ELIMINADO

  // Endpoint de salud (se mantiene)
  app.get('/health', async (request, reply) => {
    // const { checkDatabaseHealth, getDatabaseInfo } = await import('./config/database'); // Moved import to top
    
    try {
      const dbHealth = await checkDatabaseHealth();
      const dbInfo = getDatabaseInfo();
      
      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.app.apiVersion,
        environment: config.app.environment,
        database: {
          connected: dbHealth,
          info: dbInfo,
        },
        features: {
          googleSheets: config.googleSheets.enabled,
          sync: config.sync.enabled,
          cache: config.cache.enabled,
        },
      });
    } catch (error) {
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
        message: config.app.environment === 'development' ? (error as Error).message : 'Service unavailable',
      });
    }
  });

  // Endpoint de información (se mantiene)
  app.get('/info', async (request, reply) => {
    return reply.send({
      name: 'Estadísticas Backend API',
      version: config.app.apiVersion,
      description: 'Backend API para sistema de estadísticas judiciales con TypeORM, tRPC y Fastify',
      author: 'Dante',
      environment: config.app.environment,
      endpoints: {
        health: '/health',
        info: '/info',
        // api: '/api', // <-- Puedes eliminar esta línea si ya no existe '/api'
        trpc: config.trpc.endpoint,
      },
      features: {
        database: 'MySQL + TypeORM',
        api: 'tRPC + Fastify',
        sync: config.sync.enabled ? 'Google Sheets' : 'Disabled',
        cache: config.cache.enabled ? 'Enabled' : 'Disabled',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Manejo de errores global (se mantiene)
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error(error);

    const errAny = error as any;
    // Error de validación (podría venir de Zod via tRPC)
    if (errAny?.validation || errAny?.code === 'BAD_REQUEST' || (errAny?.cause && errAny?.cause.name === 'ZodError')) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Los datos enviados no son válidos',
        details: errAny?.validation || errAny?.cause?.issues, // Mostrar issues de Zod si existen
        timestamp: new Date().toISOString(),
      });
    }

    // Error de base de datos
    if (error.message.includes('database') || error.message.includes('mysql')) {
      return reply.code(503).send({
        error: 'Database Error',
        message: 'Error de conexión con la base de datos',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Errores específicos de tRPC (NOT_FOUND, UNAUTHORIZED, etc.)
    // El adaptador fastifyTRPCPlugin debería manejarlos, pero puedes añadir lógica específica si quieres
    if (errAny?.code && typeof errAny.code === 'string' && errAny.code in httpStatusMap) {
       const statusCode = httpStatusMap[errAny.code as keyof typeof httpStatusMap];
       return reply.code(statusCode).send({
         error: errAny.code,
         message: errAny.message,
         timestamp: new Date().toISOString(),
       });
    }


    // Error interno del servidor
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: config.app.environment === 'development' ? error.message : 'Ha ocurrido un error interno',
      timestamp: new Date().toISOString(),
    });
  });

  // Handler para rutas no encontradas (se mantiene, pero ajusta las rutas disponibles)
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: 'Not Found',
      message: `Ruta ${request.url} no encontrada`,
      availableRoutes: ['/health', '/info', config.trpc.endpoint], // <-- Rutas actualizadas
      timestamp: new Date().toISOString(),
    });
  });

  // Hooks (se mantienen)
  app.addHook('onRequest', async (request, reply) => {
    app.log.info(`${request.method} ${request.url}`);
  });

  app.addHook('onResponse', async (request, reply) => {
    app.log.info(`${request.method} ${request.url} - ${reply.statusCode} - ${reply.getResponseTime()}ms`);
  });

  return app;
}

// Map tRPC error codes to HTTP status codes for better error handling
const httpStatusMap = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
};


// Función para cerrar la aplicación limpiamente (se mantiene)
export async function closeApp(app: FastifyInstance) {
  try {
    // const { closeDatabase } = await import('./config/database'); // Moved import to top
    
    app.log.info('📴 Cerrando aplicación...');
    
    // Cerrar conexión de base de datos
    await closeDatabase();
    
    // Cerrar servidor Fastify
    await app.close();
    
    app.log.info('✅ Aplicación cerrada correctamente');
  } catch (error) {
    app.log.error('❌ Error cerrando aplicación: %s', error);
    throw error;
  }
}