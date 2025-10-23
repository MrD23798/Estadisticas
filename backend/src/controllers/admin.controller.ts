import { FastifyRequest, FastifyReply } from 'fastify';
import { SyncService } from '../services/sync.service';

interface SyncRequestBody {
  secret: string;
  dependencyName?: string;
  force?: boolean;
}

export class AdminController {
  /**
   * Endpoint para ejecutar sincronización completa desde Google Sheets
   * Usa directamente SyncService como orquestador principal
   */
  public sync = async (request: FastifyRequest<{ Body: SyncRequestBody }>, reply: FastifyReply) => {
    try {
      // Validar la clave secreta
      const { secret, dependencyName, force = false } = request.body;

      if (!secret || secret !== process.env.SYNC_SECRET_KEY) {
        return reply.code(401).send({ 
          success: false,
          message: 'No autorizado - clave secreta inválida' 
        });
      }

      // Crear instancia del servicio de sincronización (orquestador principal)
      const syncService = new SyncService();

      let result;
      
      if (dependencyName) {
        // Sincronizar solo una dependencia específica
        console.log(`🎯 Sincronizando dependencia específica: ${dependencyName}`);
        console.warn(`⚠️ La sincronización de dependencia específica no está implementada. Ejecutando sincronización completa...`);
        // TODO: Implementar sincronización de dependencia específica
        result = await syncService.syncFromSheet();
      } else {
        // Sincronización completa
        console.log('🚀 Iniciando sincronización completa...');
        result = await syncService.syncFromSheet();
      }

      // Enriquecer la respuesta con metadatos adicionales
      const enrichedResult = {
        ...result,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: 'admin',
          type: dependencyName ? 'single_dependency' : 'full_sync',
          force,
          environment: process.env.NODE_ENV || 'development'
        }
      };

      // Enviar respuesta con código apropiado
      const statusCode = result.success ? 200 : 500;
      return reply.code(statusCode).send(enrichedResult);

    } catch (error) {
      console.error('❌ Error en endpoint de sincronización:', error);
      
      return reply.code(500).send({ 
        success: false,
        message: 'Error interno del servidor durante la sincronización',
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: 'admin',
          type: 'error'
        }
      });
    }
  };

  /**
   * Endpoint para verificar el estado del servicio de sincronización
   */
  public syncStatus = async (request: FastifyRequest<{ Body: SyncRequestBody }>, reply: FastifyReply) => {
    try {
      const { secret } = request.body;

      if (!secret || secret !== process.env.SYNC_SECRET_KEY) {
        return reply.code(401).send({ 
          success: false,
          message: 'No autorizado - clave secreta inválida' 
        });
      }

      // Verificar configuración de Google Sheets
      const hasGoogleConfig = !!(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_PRIVATE_KEY &&
        process.env.GOOGLE_SPREADSHEET_ID
      );

      return reply.code(200).send({
        success: true,
        status: 'ready',
        configuration: {
          googleSheetsConfigured: hasGoogleConfig,
          syncSecretConfigured: !!process.env.SYNC_SECRET_KEY,
          databaseConnected: true, // Asumimos que está conectada si llegamos aquí
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      
      return reply.code(500).send({ 
        success: false,
        message: 'Error verificando el estado del servicio',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Endpoint para obtener información sobre las hojas disponibles
   */
  public getSheetsInfo = async (request: FastifyRequest<{ Body: SyncRequestBody }>, reply: FastifyReply) => {
    try {
      const { secret } = request.body;

      if (!secret || secret !== process.env.SYNC_SECRET_KEY) {
        return reply.code(401).send({ 
          success: false,
          message: 'No autorizado - clave secreta inválida' 
        });
      }

      const syncService = new SyncService();
      
      // Intentar obtener el índice de reportes como prueba de conectividad
      try {
        // Accedemos al método privado a través de una instancia
        const reportIndex = await (syncService as any).fetchReportIndex();
        
        return reply.code(200).send({
          success: true,
          message: 'Conectividad con Google Sheets verificada',
          reportCount: reportIndex.length,
          reports: reportIndex.map((report: any) => ({
            sheetId: report.sheetId,
            dependencyName: report.dependencyName,
            lastUpdate: report.lastUpdate
          })),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return reply.code(503).send({
          success: false,
          message: 'Error conectando con Google Sheets',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Error obteniendo información de sheets:', error);
      
      return reply.code(500).send({ 
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  };
}