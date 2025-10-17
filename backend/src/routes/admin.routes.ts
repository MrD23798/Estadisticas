import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';

const controller = new AdminController();

/**
 * Rutas de administración para el sistema de sincronización
 * Todas las rutas requieren autenticación mediante clave secreta
 */
export default async function adminRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /sync
   * Ejecuta la sincronización desde Google Sheets
   * 
   * Body:
   * {
   *   "secret": "tu_clave_secreta",
   *   "dependencyName": "opcional - nombre específico de dependencia"
   * }
   */
  fastify.post('/sync', {
    schema: {
      description: 'Ejecutar sincronización desde Google Sheets',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['secret'],
        properties: {
          secret: { 
            type: 'string',
            description: 'Clave secreta para autorizar la operación'
          },
          dependencyName: { 
            type: 'string',
            description: 'Nombre específico de la dependencia a sincronizar (opcional)'
          }
        }
      },
      response: {
        200: {
          description: 'Sincronización exitosa',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string' },
            requestedBy: { type: 'string' },
            type: { type: 'string' }
          }
        },
        401: {
          description: 'No autorizado',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Error interno',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, controller.sync);

  /**
   * POST /sync/status
   * Verificar el estado del servicio de sincronización
   * 
   * Body:
   * {
   *   "secret": "tu_clave_secreta"
   * }
   */
  fastify.post('/sync/status', {
    schema: {
      description: 'Verificar estado del servicio de sincronización',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['secret'],
        properties: {
          secret: { 
            type: 'string',
            description: 'Clave secreta para autorizar la operación'
          }
        }
      },
      response: {
        200: {
          description: 'Estado del servicio',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'string' },
            configuration: { type: 'object' },
            environment: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, controller.syncStatus);

  /**
   * POST /sync/sheets-info
   * Obtener información sobre las hojas de Google Sheets disponibles
   * 
   * Body:
   * {
   *   "secret": "tu_clave_secreta"
   * }
   */
  fastify.post('/sync/sheets-info', {
    schema: {
      description: 'Obtener información de las hojas de Google Sheets',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['secret'],
        properties: {
          secret: { 
            type: 'string',
            description: 'Clave secreta para autorizar la operación'
          }
        }
      },
      response: {
        200: {
          description: 'Información de las hojas',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            reportCount: { type: 'number' },
            reports: { type: 'array' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, controller.getSheetsInfo);

  // Hook para logging de requests admin
  fastify.addHook('preHandler', async (request, reply) => {
    console.log(`🔐 Admin request: ${request.method} ${request.url} from ${request.ip}`);
  });
}