import { GoogleSheetsService, googleSheetsService } from './google.sheets.service';

/**
 * Servicio de sincronización que orquesta las operaciones de sincronización de datos
 * desde Google Sheets a la base de datos local.
 * 
 * Actúa como punto de entrada principal para las sincronizaciones,
 * delegando la lógica específica al GoogleSheetsService.
 */
export class SyncService {
  constructor(
    private googleSheetsService: GoogleSheetsService = googleSheetsService
  ) {
    // Verificar que el servicio de Google Sheets esté disponible
    if (!this.googleSheetsService.isAvailable()) {
      throw new Error('Google Sheets service no está disponible. Verifica la configuración de API Key o Service Account.');
    }
  }

  /**
   * Método principal que orquesta todo el proceso de sincronización
   */
  public async syncFromSheet(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 Iniciando sincronización desde Google Sheets...');
      
      // Delegar toda la lógica al GoogleSheetsService
      const resultado = await this.googleSheetsService.syncToDatabase();
      
      return {
        success: true,
        message: `Sincronización finalizada. Insertados: ${resultado.insertados}, Actualizados: ${resultado.actualizados}`,
        details: resultado
      };
    } catch (error) {
      console.error('💥 Error general en la sincronización:', error);
      return {
        success: false,
        message: `Error en la sincronización: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Verificar si el servicio de sincronización está disponible
   */
  public isAvailable(): boolean {
    return this.googleSheetsService.isAvailable();
  }

  /**
   * Probar conectividad con Google Sheets
   */
  public async testConnection(): Promise<boolean> {
    return this.googleSheetsService.testConnection();
  }
}

// Instancia singleton para uso en toda la aplicación
export const syncService = new SyncService();