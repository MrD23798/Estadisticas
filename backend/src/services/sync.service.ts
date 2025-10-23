import { GoogleSheetsService } from './google.sheets.service';

/**
 * Servicio simplificado que delega la sincronización al GoogleSheetsService
 * Este servicio existe principalmente por compatibilidad con código existente
 */
export class SyncService {
  private googleSheetsService: GoogleSheetsService;

  constructor(googleSheetsService?: GoogleSheetsService) {
    // Inicializar el servicio de Google Sheets
    this.googleSheetsService = googleSheetsService || new GoogleSheetsService();
    
    // Verificar que el servicio de Google Sheets esté disponible
    if (!this.googleSheetsService.isAvailable()) {
      throw new Error('Google Sheets service no está disponible. Verifica la configuración de API Key o Service Account.');
    }
  }

  /**
   * Método principal que orquesta todo el proceso de sincronización
   */
  public async syncFromSheet(sheetNames?: string[]): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔄 Iniciando sincronización desde Google Sheets...');
      
      // Delegar toda la lógica al GoogleSheetsService
      const resultado = await this.googleSheetsService.syncToDatabase(sheetNames);
      
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
}
