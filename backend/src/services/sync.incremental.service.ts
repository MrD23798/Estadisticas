import { AppDataSource } from '../config/database';
import { Estadistica } from '../database/entities/Estadistica';
import { config } from '../config';
import { googleSheetsService } from './google.sheets.service';

interface SyncResult {
  success: boolean;
  message: string;
  sheetId?: string;
  registrosInsertados?: number;
  error?: string;
}

export const incrementalSyncService = {
  /**
   * Sincronizar un nuevo ID de hoja de cálculo individual
   * @param sheetId ID de la hoja de cálculo a sincronizar
   * @param periodo Periodo de la estadística (formato YYYYMM)
   * @param dependenciaNombre Nombre de la dependencia
   */
  async syncSingleSheet(
    sheetId: string,
    periodo: string,
    dependenciaNombre: string
  ): Promise<SyncResult> {
    try {
      console.log(`🔄 Iniciando sincronización incremental para hoja ${sheetId}`);
      
      // Verificar si la hoja ya existe en la base de datos
      const estadisticaRepo = AppDataSource.getRepository(Estadistica);
      const existing = await estadisticaRepo
        .createQueryBuilder('e')
        .leftJoin('e.dependencia', 'd')
        .where('e.sheetId = :sheetId', { sheetId })
        .andWhere('d.nombre = :dependencia', { dependencia: dependenciaNombre })
        .andWhere('e.periodo = :periodo', { periodo })
        .getOne();
      
      if (existing) {
        console.log(`⚠️ La hoja ${sheetId} ya existe en la base de datos`);
        return {
          success: false,
          message: 'Esta hoja ya está sincronizada en la base de datos',
          sheetId
        };
      }

      // Verificar que el servicio de Google Sheets esté disponible
      if (!googleSheetsService.isAvailable()) {
        throw new Error('El servicio de Google Sheets no está disponible');
      }

      // Crear estructura para la dependencia
      const dependenciaInfo = {
        tipo: 'DEPENDENCIA',
        nombre: dependenciaNombre
      };

      // Intentar leer los datos de la hoja individual
      const individualData = await googleSheetsService.readIndividualSpreadsheet(
        sheetId,
        dependenciaInfo,
        periodo
      );

      if (!individualData) {
        throw new Error(`No se pudieron extraer datos de la hoja ${sheetId}`);
      }

      // Guardar los datos en la base de datos
      await googleSheetsService.saveEstadisticaToDatabase(individualData);

      console.log(`✅ Sincronización de hoja ${sheetId} completada con éxito`);
      return {
        success: true,
        message: 'Hoja sincronizada correctamente',
        sheetId,
        registrosInsertados: 1
      };
    } catch (error: any) {
      console.error(`❌ Error sincronizando hoja ${sheetId}:`, error);
      return {
        success: false,
        message: 'Error al sincronizar la hoja',
        sheetId,
        error: error.message || String(error)
      };
    }
  },

  /**
   * Verificar si un ID de hoja ya está en la base de datos
   */
  async isSheetAlreadySynced(sheetId: string): Promise<boolean> {
    const estadisticaRepo = AppDataSource.getRepository(Estadistica);
    const count = await estadisticaRepo.count({
      where: { sheetId }
    });
    return count > 0;
  }
};