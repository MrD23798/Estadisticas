import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import { config } from './config';
import { initializeDatabase } from './config/database';
import { estadisticasRoutes } from './routes/estadisticas.routes';
import { legacyStatsRoutes } from './routes/legacy-stats.routes';
import adminRoutes from './routes/admin.routes';

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

  // Registrar rutas principales
  await app.register(estadisticasRoutes, { prefix: '/api' });
  
  // Registrar rutas legacy para compatibilidad
  await app.register(legacyStatsRoutes, { prefix: '/api' });

  // Registrar rutas de administración
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // Endpoint de salud
  app.get('/health', async (request, reply) => {
    const { checkDatabaseHealth, getDatabaseInfo } = await import('./config/database');
    
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

  // Endpoint de información
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
        api: '/api',
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

  // Manejo de errores global
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error(error);

    // Error de validación
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Los datos enviados no son válidos',
        details: error.validation,
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

    // Error interno del servidor
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: config.app.environment === 'development' ? error.message : 'Ha ocurrido un error interno',
      timestamp: new Date().toISOString(),
    });
  });

  // Handler para rutas no encontradas
  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send({
      error: 'Not Found',
      message: `Ruta ${request.url} no encontrada`,
      availableRoutes: ['/health', '/info', '/api'],
      timestamp: new Date().toISOString(),
    });
  });

  // Hook para logging de requests
  app.addHook('onRequest', async (request, reply) => {
    app.log.info(`${request.method} ${request.url}`);
  });

  // Hook para timing de responses
  app.addHook('onResponse', async (request, reply) => {
    app.log.info(`${request.method} ${request.url} - ${reply.statusCode} - ${reply.getResponseTime()}ms`);
  });

  return app;
}

// Función para cerrar la aplicación limpiamente
export async function closeApp(app: FastifyInstance) {
  try {
    const { closeDatabase } = await import('./config/database');
    
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