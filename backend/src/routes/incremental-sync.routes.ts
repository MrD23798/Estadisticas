import { FastifyInstance } from 'fastify';
import { incrementalSyncController } from '../controllers/incremental-sync.controller';

export async function incrementalSyncRoutes(fastify: FastifyInstance) {
  // Sincronizar una nueva hoja individual
  fastify.post('/sync/sheet', {
    schema: {
      description: 'Sincronizar una nueva hoja individual',
      tags: ['sincronización'],
      body: {
        type: 'object',
        required: ['sheetId', 'periodo', 'dependencia'],
        properties: {
          sheetId: { type: 'string', description: 'ID de la hoja de cálculo de Google' },
          periodo: { type: 'string', description: 'Periodo en formato YYYYMM (ejemplo: 202410)' },
          dependencia: { type: 'string', description: 'Nombre de la dependencia' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            sheetId: { type: 'string' },
            registrosInsertados: { type: 'number' }
          }
        }
      }
    },
    handler: incrementalSyncController.syncSingleSheet
  });

  // Verificar si una hoja ya está sincronizada
  fastify.get('/sync/sheet/:sheetId/status', {
    schema: {
      description: 'Verificar si una hoja ya está sincronizada',
      tags: ['sincronización'],
      params: {
        type: 'object',
        required: ['sheetId'],
        properties: {
          sheetId: { type: 'string', description: 'ID de la hoja de cálculo de Google' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            sheetId: { type: 'string' },
            isSynced: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: incrementalSyncController.checkSheetStatus
  });
}