import { google } from 'googleapis';
import { AppDataSource } from '../config/database';
import { Dependencia } from '../database/entities/Dependencia';
import { Estadistica } from '../database/entities/Estadistica';
import { TipoCaso } from '../database/entities/TipoCaso';
import { EstadisticaTipoCaso } from '../database/entities/EstadisticaTipoCaso';

interface ReportIndex {
  sheetId: string;
  dependencyName: string;
  lastUpdate?: Date;
}

interface ParsedReportData {
  context: {
    dependencyName: string;
    year: number;
    month: number;
    period: string;
  };
  totals: {
    expedientesExistentes: number;
    expedientesRecibidos: number;
    expedientesReingresados: number;
  };
  caseTypes: Array<{
    name: string;
    recibidosAsignados: number;
    reingresados: number;
    existentes: number;
    resueltos: number;
    pendientes: number;
  }>;
  metadata: {
    nombreJuez?: string;
    nombreSecretario?: string;
    observaciones?: string;
    fuenteDatos: 'google_sheets';
    version: string;
  };
}

export class SyncService {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // Validar variables de entorno requeridas
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!email || !privateKey || !spreadsheetId) {
      throw new Error('Variables de entorno de Google Sheets no configuradas correctamente');
    }

    // Configuración de Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Método principal que orquesta todo el proceso de sincronización
   */
  public async syncFromSheet(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('� Iniciando sincronización desde Google Sheets...');
      
      const reportIndex = await this.fetchReportIndex();
      console.log(`📋 Encontrados ${reportIndex.length} reportes para procesar`);
      
      const results = [];
      
      for (const report of reportIndex) {
        console.log(`📊 Procesando reporte para: ${report.dependencyName}`);
        try {
          const result = await this.processSingleReport(report.sheetId, report.dependencyName);
          results.push({ ...report, success: true, result });
        } catch (error) {
          console.error(`❌ Error al procesar el reporte ${report.sheetId}:`, error);
          results.push({ ...report, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Sincronización finalizada. Éxito: ${successCount}, Errores: ${errorCount}`,
        details: { total: results.length, success: successCount, errors: errorCount, results }
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
   * Obtiene el índice de reportes desde una hoja maestra
   */
  private async fetchReportIndex(): Promise<ReportIndex[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Índice!A2:C', // Asumiendo que la primera fila tiene headers
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        sheetId: row[0] || '',
        dependencyName: row[1] || '',
        lastUpdate: row[2] ? new Date(row[2]) : undefined,
      })).filter((item: ReportIndex) => item.sheetId && item.dependencyName);
    } catch (error) {
      console.error('Error al obtener el índice de reportes:', error);
      throw new Error('No se pudo obtener el índice de reportes desde Google Sheets');
    }
  }

  /**
   * Procesa un reporte individual
   */
  private async processSingleReport(sheetId: string, dependencyName: string): Promise<any> {
    try {
      const sheetContent = await this.fetchSheetContent(sheetId);
      const parsedData = await this.parseReportData(sheetContent, dependencyName);
      await this.saveDataToDatabase(parsedData, dependencyName);
      
      return {
        sheetId,
        dependencyName,
        period: parsedData.context.period,
        caseTypesCount: parsedData.caseTypes.length,
        totalExpedientes: parsedData.totals.expedientesExistentes + parsedData.totals.expedientesRecibidos
      };
    } catch (error) {
      console.error(`Error procesando reporte ${sheetId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el contenido de una hoja específica
   */
  private async fetchSheetContent(sheetId: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetId}!A1:Z100`, // Rango amplio para capturar toda la data
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error al obtener contenido de la hoja ${sheetId}:`, error);
      throw new Error(`No se pudo obtener el contenido de la hoja ${sheetId}`);
    }
  }

  /**
   * Parsea los datos del reporte desde las filas de la hoja
   */
  private async parseReportData(sheetData: any[][], dependencyName: string): Promise<ParsedReportData> {
    // Esta implementación depende del formato específico de tus hojas
    // Aquí hay un ejemplo básico que deberás adaptar
    
    const parsedData: ParsedReportData = {
      context: {
        dependencyName,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        period: ''
      },
      totals: {
        expedientesExistentes: 0,
        expedientesRecibidos: 0,
        expedientesReingresados: 0
      },
      caseTypes: [],
      metadata: {
        fuenteDatos: 'google_sheets',
        version: '1.0'
      }
    };

    // Buscar información de período en las primeras filas
    for (let i = 0; i < Math.min(10, sheetData.length); i++) {
      const row = sheetData[i];
      if (row && row.length > 0) {
        const cellValue = String(row[0]).toLowerCase();
        
        // Buscar año y mes en diferentes formatos posibles
        const dateMatch = cellValue.match(/(\d{4}).*(\d{1,2})/);
        if (dateMatch && dateMatch[1] && dateMatch[2]) {
          parsedData.context.year = parseInt(dateMatch[1]);
          parsedData.context.month = parseInt(dateMatch[2]);
          break;
        }
      }
    }

    // Crear período en formato YYYYMM
    parsedData.context.period = `${parsedData.context.year}${String(parsedData.context.month).padStart(2, '0')}`;

    // Buscar totales generales
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row.length > 1) {
        const label = String(row[0]).toLowerCase();
        const value = parseInt(String(row[1])) || 0;

        if (label.includes('existentes')) {
          parsedData.totals.expedientesExistentes = value;
        } else if (label.includes('recibidos')) {
          parsedData.totals.expedientesRecibidos = value;
        } else if (label.includes('reingresados')) {
          parsedData.totals.expedientesReingresados = value;
        }
      }
    }

    // Buscar datos por tipo de caso
    // Esto depende del formato específico de tus hojas
    let inCaseTypeSection = false;
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0]).toLowerCase();

      // Detectar inicio de sección de tipos de caso
      if (firstCell.includes('tipo') && firstCell.includes('caso')) {
        inCaseTypeSection = true;
        continue;
      }

      // Si estamos en la sección de tipos de caso
      if (inCaseTypeSection && row.length >= 4) {
        const caseName = String(row[0]).trim();
        if (caseName && !caseName.toLowerCase().includes('total')) {
          parsedData.caseTypes.push({
            name: caseName,
            recibidosAsignados: parseInt(String(row[1])) || 0,
            reingresados: parseInt(String(row[2])) || 0,
            existentes: parseInt(String(row[3])) || 0,
            resueltos: parseInt(String(row[4])) || 0,
            pendientes: parseInt(String(row[5])) || 0,
          });
        }
      }
    }

    return parsedData;
  }

  /**
   * Guarda los datos parseados en la base de datos de forma transaccional
   */
  private async saveDataToDatabase(parsedData: ParsedReportData, dependencyName: string): Promise<void> {
    await AppDataSource.transaction(async (transactionManager) => {
      // 1. Buscar o crear la dependencia
      let dependency = await transactionManager.findOneBy(Dependencia, { 
        nombre: Dependencia.normalizarNombre(dependencyName) 
      });
      
      if (!dependency) {
        dependency = new Dependencia();
        dependency.nombre = Dependencia.normalizarNombre(dependencyName);
        dependency.tipo = Dependencia.extraerTipo(dependencyName);
        dependency.activa = true;
        dependency = await transactionManager.save(Dependencia, dependency);
      }

      // 2. Buscar o crear el registro de estadística principal
      let statisticRecord = await transactionManager.findOne(Estadistica, {
        where: {
          dependenciaId: dependency.id,
          periodo: parsedData.context.period,
        }
      });

      if (!statisticRecord) {
        statisticRecord = new Estadistica();
        statisticRecord.dependenciaId = dependency.id;
        statisticRecord.periodo = parsedData.context.period;
        statisticRecord.sheetId = `${dependency.id}_${parsedData.context.period}`;
        statisticRecord.fechaEstadistica = new Date(parsedData.context.year, parsedData.context.month - 1, 1);
      }

      // Actualizar totales
      Object.assign(statisticRecord, parsedData.totals);
      statisticRecord.metadatos = parsedData.metadata;
      
      statisticRecord = await transactionManager.save(Estadistica, statisticRecord);

      // 3. Procesar estadísticas por tipo de caso
      for (const caseTypeData of parsedData.caseTypes) {
        // Buscar o crear el tipo de caso
        let caseType = await transactionManager.findOneBy(TipoCaso, { 
          name: TipoCaso.normalizarNombre(caseTypeData.name) 
        });
        
        if (!caseType) {
          caseType = new TipoCaso();
          caseType.name = TipoCaso.normalizarNombre(caseTypeData.name);
          caseType.activo = true;
          caseType = await transactionManager.save(TipoCaso, caseType);
        }

        // Buscar o crear la estadística del tipo de caso
        let caseTypeStat = await transactionManager.findOne(EstadisticaTipoCaso, {
          where: {
            estadisticaId: statisticRecord.id,
            tipoCasoId: caseType.id,
          }
        });

        if (!caseTypeStat) {
          caseTypeStat = new EstadisticaTipoCaso();
          caseTypeStat.estadisticaId = statisticRecord.id;
          caseTypeStat.tipoCasoId = caseType.id;
        }

        // Actualizar datos
        caseTypeStat.recibidosAsignados = caseTypeData.recibidosAsignados;
        caseTypeStat.reingresados = caseTypeData.reingresados;
        caseTypeStat.existentes = caseTypeData.existentes;
        caseTypeStat.resueltos = caseTypeData.resueltos;
        caseTypeStat.pendientes = caseTypeData.pendientes;
        
        // Sincronizar totales y calcular porcentajes
        caseTypeStat.sincronizarTotales();
        
        await transactionManager.save(EstadisticaTipoCaso, caseTypeStat);
      }
    });

    console.log(`✅ Datos guardados para ${dependencyName} - ${parsedData.context.period}`);
  }

  /**
   * Método para sincronizar solo una dependencia específica
   */
  public async syncSingleDependency(dependencyName: string): Promise<{ success: boolean; message: string }> {
    try {
      const reportIndex = await this.fetchReportIndex();
      const report = reportIndex.find(r => 
        r.dependencyName.toLowerCase().includes(dependencyName.toLowerCase())
      );

      if (!report) {
        return {
          success: false,
          message: `No se encontró reporte para la dependencia: ${dependencyName}`
        };
      }

      await this.processSingleReport(report.sheetId, report.dependencyName);
      
      return {
        success: true,
        message: `Sincronización exitosa para ${report.dependencyName}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al sincronizar ${dependencyName}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}