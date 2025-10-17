import { incrementalSyncService } from '../services/sync.incremental.service';

export const incrementalSyncController = {
  /**
   * Sincronizar una nueva hoja individual
   */
  async syncSingleSheet(req: any, reply: any) {
    try {
      const { sheetId, periodo, dependencia } = req.body;
      
      // Validación básica
      if (!sheetId || !periodo || !dependencia) {
        return reply.status(400).send({
          success: false,
          message: 'Faltan parámetros requeridos: sheetId, periodo, dependencia'
        });
      }
      
      // Validar formato de periodo (YYYYMM)
      if (!/^\d{6}$/.test(periodo)) {
        return reply.status(400).send({
          success: false,
          message: 'El periodo debe tener formato YYYYMM (ejemplo: 202410)'
        });
      }
      
      // Ejecutar sincronización
      const result = await incrementalSyncService.syncSingleSheet(
        sheetId,
        periodo,
        dependencia
      );
      
      if (result.success) {
        return reply.status(200).send(result);
      } else {
        return reply.status(400).send(result);
      }
      
    } catch (error: any) {
      console.error('❌ Error en sincronización incremental:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },
  
  /**
   * Verificar si una hoja ya está sincronizada
   */
  async checkSheetStatus(req: any, reply: any) {
    try {
      const { sheetId } = req.params;
      
      if (!sheetId) {
        return reply.status(400).send({
          success: false,
          message: 'Falta el ID de la hoja'
        });
      }
      
      const isSynced = await incrementalSyncService.isSheetAlreadySynced(sheetId);
      
      return reply.status(200).send({
        success: true,
        sheetId,
        isSynced,
        message: isSynced 
          ? 'La hoja ya está sincronizada en la base de datos' 
          : 'La hoja no está sincronizada en la base de datos'
      });
      
    } catch (error: any) {
      console.error('❌ Error al verificar estado de hoja:', error);
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};