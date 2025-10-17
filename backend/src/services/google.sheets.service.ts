import { google } from 'googleapis';
import { config } from '../config';
import { AppDataSource } from '../config/database';
import { Dependencia } from '../database/entities/Dependencia';
import { Estadistica } from '../database/entities/Estadistica';

interface SheetInfo {
  id: string;
  name: string;
  periodo: number;
  rowCount: number;
  lastModified: Date;
}

interface EstadisticaData {
  sheetId: string;
  dependencia: string;
  periodo: string;
  fechaEstadistica?: Date;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  categoriasDetalle: Record<string, { asignados: number; reingresados: number }>;
  metadatos?: {
    nombreJuez?: string;
    nombreSecretario?: string;
    fuenteDatos?: string;
  };
}

export class GoogleSheetsService {
  private sheets: any;
  private auth: any;
  private isInitialized = false;
  private rateLimitDelay = 1000; // Initial delay between requests (1 second)
  private readonly MAX_RATE_LIMIT_DELAY = 60000; // Maximum delay (1 minute)
  private requestsInLastMinute = 0;
  private lastRequestTime = 0;
  private consecutiveRateLimitErrors = 0;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      if (!config.googleSheets.enabled) {
        console.warn('⚠️ Google Sheets service disabled - credentials not configured');
        return;
      }

      // Opción 1: Usar API Key (más simple, requiere hoja pública)
      if (config.googleSheets.apiKey) {
        this.sheets = google.sheets({ 
          version: 'v4', 
          auth: config.googleSheets.apiKey 
        });
        this.isInitialized = true;
        console.log('✅ Google Sheets service initialized with API Key');
        return;
      }

      // Opción 2: Service Account (más seguro, requiere compartir con service account)
      if (config.googleSheets.clientEmail && config.googleSheets.privateKey) {
        this.auth = new google.auth.JWT(
          config.googleSheets.clientEmail,
          undefined,
          config.googleSheets.privateKey,
          ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );

        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        this.isInitialized = true;
        console.log('✅ Google Sheets service initialized with Service Account');
        return;
      }

      throw new Error('No Google Sheets credentials configured');

    } catch (error) {
      console.error('❌ Error initializing Google Sheets service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.isInitialized && config.googleSheets.enabled;
  }

  /**
   * Obtener lista de todos los sheets disponibles
   */
  async listAvailableSheets(): Promise<SheetInfo[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Sheets service not available');
    }

    try {
      const response: any = await this.controlledRequest(() => this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId
      }));

      const sheets = response.data.sheets || [];
      const validSheets: SheetInfo[] = [];
      
      // Buscar hojas con datos estructurados (como "Datos", "Resultados", etc.)
      for (const sheet of sheets) {
        if (!sheet?.properties) continue;
        
        const title = sheet.properties.title;
        const sheetId = sheet.properties.sheetId.toString();
        
        // Verificar si la hoja tiene estructura de datos válida
        if (await this.hasValidDataStructure(title)) {
          validSheets.push({
            id: sheetId,
            name: title,
            periodo: 0, // Ya no extraemos período del nombre
            rowCount: sheet.properties.gridProperties?.rowCount || 0,
            lastModified: new Date(),
          });
        }
      }

      return validSheets;

    } catch (error) {
      console.error('Error listing sheets:', error);
      throw new Error('Failed to list available sheets');
    }
  }

  /**
   * Verificar si una hoja tiene estructura de datos válida
   */
  private async hasValidDataStructure(sheetName: string): Promise<boolean> {
    try {
      const response: any = await this.controlledRequest(() => this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${sheetName}!A1:Z2`, // Solo verificar encabezados
        valueRenderOption: 'UNFORMATTED_VALUE'
      }));

      const rows = response.data.values || [];
      if (rows.length === 0) return false;

      const headers = (rows[0] || []).map((h: any) => h?.toString().toLowerCase());
      
      // Estructura para "Datos Crudos" (IDs de spreadsheets individuales)
      const hasCrudosStructure = 
        headers.some((h: string) => h.includes('plantilla')) &&
        headers.some((h: string) => h.includes('anio')) &&
        headers.some((h: string) => h.includes('mes')) &&
        headers.some((h: string) => h.includes('id_confirmado'));

      // Estructura para hojas consolidadas (datos directos)
      const hasDirectStructure = 
        headers.some((h: string) => h.includes('dependencia')) &&
        headers.some((h: string) => h.includes('periodo')) &&
        headers.some((h: string) => h.includes('ingreso') || h.includes('recibido'));

      return hasCrudosStructure || hasDirectStructure;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extraer y procesar datos de un sheet específico
   */
  async extractSheetData(sheetName: string): Promise<EstadisticaData[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Sheets service not available');
    }

    try {
      const range = `${sheetName}!A:Z`; // Rango amplio para capturar toda la data
      
      const response: any = await this.controlledRequest(() => this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      }));

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.warn(`No data found in sheet: ${sheetName}`);
        return [];
      }

      // Detectar tipo de estructura
      const headers = (rows[0] || []).map((h: any) => h?.toString().toLowerCase());
      const isDatosCrudos = headers.some((h: string) => h.includes('id_confirmado'));

      if (isDatosCrudos) {
        console.log(`Processing ${sheetName} as individual spreadsheet IDs...`);
        return this.processIndividualSpreadsheets(rows, sheetName);
      } else {
        console.log(`Processing ${sheetName} as consolidated data...`);
        return this.parseColumnarSheetData(rows, sheetName);
      }

    } catch (error) {
      console.error(`Error extracting data from sheet ${sheetName}:`, error);
      throw new Error(`Failed to extract data from sheet: ${sheetName}`);
    }
  }

  /**
   * Procesar spreadsheets individuales usando IDs de "Datos Crudos"
   */
  private async processIndividualSpreadsheets(rows: any[][], sheetName: string): Promise<EstadisticaData[]> {
    const estadisticas: EstadisticaData[] = [];
    
    if (rows.length < 2) {
      console.warn(`Sheet ${sheetName} has no data rows`);
      return [];
    }

    // Primera fila contiene los encabezados
    const headers = (rows[0] || []).map((h: any) => h?.toString().toLowerCase().trim());
    const dataRows = rows.slice(1); // Excluir encabezados

    // Encontrar índices de columnas importantes
    const plantillaIndex = headers.findIndex((h: string) => h.includes('plantilla'));
    const anioIndex = headers.findIndex((h: string) => h.includes('anio'));
    const mesIndex = headers.findIndex((h: string) => h.includes('mes'));
    const idConfirmadoIndex = headers.findIndex((h: string) => h.includes('id_confirmado'));

    if (plantillaIndex === -1 || anioIndex === -1 || mesIndex === -1 || idConfirmadoIndex === -1) {
      console.error('Required columns not found in Datos Crudos');
      return [];
    }

    console.log(`Processing ${dataRows.length} individual spreadsheet references...`);

    // Track successful and failed requests for statistics
    let successful = 0;
    let skipped = 0;
    let failed = 0;

    // Procesar cada fila (cada una representa un spreadsheet individual)
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row) {
        skipped++;
        continue;
      }

      const plantilla = row[plantillaIndex]?.toString().trim();
      const anio = row[anioIndex];
      const mes = row[mesIndex];
      const idConfirmado = row[idConfirmadoIndex]?.toString().trim();

      if (!plantilla || !anio || !mes || !idConfirmado) {
        console.warn(`⏩ Skipping row ${i + 2}: missing required data`);
        skipped++;
        continue;
      }

      try {
        // Extraer tipo de dependencia de la plantilla
        const dependenciaInfo = this.extractDependenciaFromPlantilla(plantilla);
        const periodo = `${anio}${mes.toString().padStart(2, '0')}`;

        console.log(`🔍 Processing ${dependenciaInfo.tipo} ${dependenciaInfo.nombre} for ${periodo}... [${i+1}/${dataRows.length}]`);

        // Intentar leer datos del spreadsheet individual
        const individualData = await this.readIndividualSpreadsheet(idConfirmado, dependenciaInfo, periodo);
        
        if (individualData) {
          estadisticas.push(individualData);
          console.log(`✅ Successfully extracted data from ${idConfirmado}`);
          successful++;
        } else {
          console.warn(`⚠️ No data extracted from ${idConfirmado}`);
          failed++;
        }

      } catch (error: any) {
        console.error(`❌ Error processing spreadsheet ${idConfirmado}:`, error);
        failed++;
        
        // Si es error de cuota, esperamos un tiempo mayor antes de continuar
        if (error?.response?.status === 429 || error?.code === 429) {
          console.log(`⏱️ Rate limit reached, pausing for recovery...`);
          // El controlledRequest ya maneja esto, pero por si acaso
        }
      }
      
      // Log progress periodically
      if ((i + 1) % 10 === 0 || i === dataRows.length - 1) {
        console.log(`📊 Progress: ${i + 1}/${dataRows.length} (${Math.round(((i + 1) / dataRows.length) * 100)}%) - Success: ${successful}, Failed: ${failed}, Skipped: ${skipped}`);
      }
    }

    console.log(`Extracted ${estadisticas.length} statistics from individual spreadsheets`);
    return estadisticas;
  }

  /**
   * Extraer información de dependencia de la plantilla
   */
  private extractDependenciaFromPlantilla(plantilla: string): { tipo: string; nombre: string } {
    const plantillaLower = plantilla.toLowerCase();
    
    if (plantillaLower.includes('previsional')) {
      return { tipo: 'JUZGADO', nombre: 'JUZGADO SECRETARÍA PREVISIONAL' };
    } else if (plantillaLower.includes('tributaria')) {
      return { tipo: 'JUZGADO', nombre: 'JUZGADO SECRETARÍA TRIBUTARIA' };
    } else if (plantillaLower.includes('sala')) {
      return { tipo: 'SALA', nombre: 'SALA' };
    } else {
      return { tipo: 'DEPENDENCIA', nombre: plantilla.substring(0, 50) };
    }
  }

  /**
   * Leer datos de un spreadsheet individual
   * @public - Expuesto para uso en sincronización incremental
   */
  async readIndividualSpreadsheet(
    spreadsheetId: string, 
    dependenciaInfo: { tipo: string; nombre: string }, 
    periodo: string
  ): Promise<EstadisticaData | null> {
    try {
      // Leer primeras hojas del spreadsheet individual
      const metaResponse: any = await this.controlledRequest(() => this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      }));

      const sheets = metaResponse.data.sheets || [];
      if (sheets.length === 0) {
        console.warn(`No sheets found in spreadsheet ${spreadsheetId}`);
        return null;
      }

      // Intentar leer datos de la primera hoja
      const firstSheetName = sheets[0]?.properties?.title || 'Sheet1';
      
      const dataResponse: any = await this.controlledRequest(() => this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${firstSheetName}!A1:Z200`, // Rango más amplio para capturar toda la estructura
        valueRenderOption: 'UNFORMATTED_VALUE'
      }));

      const rows = dataResponse.data.values || [];
      
      if (rows.length === 0) {
        console.warn(`No data found in ${spreadsheetId}/${firstSheetName}`);
        return null;
      }

      // Buscar la estructura de "EXPEDIENTES RECIBIDOS"
      const parsedData = this.parseDetailedSpreadsheet(rows);
      
      return {
        sheetId: spreadsheetId,
        dependencia: dependenciaInfo.nombre,
        periodo: periodo,
        fechaEstadistica: new Date(`${periodo.substring(0, 4)}-${periodo.substring(4, 6)}-01`),
        expedientesExistentes: parsedData.existentes,
        expedientesRecibidos: parsedData.recibidos,
        expedientesReingresados: parsedData.reingresados,
        categoriasDetalle: parsedData.categorias,
        metadatos: {
          fuenteDatos: `Individual Spreadsheet - ${spreadsheetId}`
        }
      };

    } catch (error) {
      console.error(`Error reading individual spreadsheet ${spreadsheetId}:`, error);
      return null;
    }
  }

  /**
   * Parsear spreadsheet individual con estructura detallada
   */
  private parseDetailedSpreadsheet(rows: any[][]): {
    existentes: number;
    recibidos: number;
    reingresados: number;
    categorias: Record<string, { asignados: number; reingresados: number }>;
  } {
    const result = {
      existentes: 0,
      recibidos: 0,
      reingresados: 0,
      categorias: {} as Record<string, { asignados: number; reingresados: number }>
    };

    // Buscar secciones específicas
    let expedientesExistentesFound = false;
    let expedientesRecibidosFound = false;
    let inRecibidosDetailSection = false;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const firstCell = row[0]?.toString().trim() || '';

      // Buscar "I. EXPEDIENTES EXISTENTES"
      if (firstCell.includes('I. EXPEDIENTES EXISTENTES') && !expedientesExistentesFound) {
        // Buscar el número en la fila actual o siguientes
        for (let j = 1; j < row.length; j++) {
          const cellValue = row[j];
          if (typeof cellValue === 'number' && cellValue > 1000) {
            result.existentes = cellValue;
            expedientesExistentesFound = true;
            console.log(`Found EXISTENTES: ${cellValue} at row ${i+1} col ${String.fromCharCode(65+j)}`);
            break;
          }
        }
        continue;
      }

      // Buscar "II. EXPEDIENTES RECIBIDOS"
      if (firstCell.includes('II. EXPEDIENTES RECIBIDOS') && !expedientesRecibidosFound) {
        // Buscar el número en la fila actual o siguientes
        for (let j = 1; j < row.length; j++) {
          const cellValue = row[j];
          if (typeof cellValue === 'number' && cellValue > 0) {
            result.recibidos = cellValue;
            expedientesRecibidosFound = true;
            console.log(`Found RECIBIDOS: ${cellValue} at row ${i+1} col ${String.fromCharCode(65+j)}`);
            break;
          }
        }
        
        // Buscar también en la fila siguiente (H12) por si hay un total mayor
        if (i + 1 < rows.length) {
          const nextRow = rows[i + 1] || [];
          for (let j = 1; j < nextRow.length; j++) {
            const cellValue = nextRow[j];
            if (typeof cellValue === 'number' && cellValue > result.recibidos) {
              result.recibidos = cellValue;
              console.log(`Found LARGER RECIBIDOS: ${cellValue} at row ${i+2} col ${String.fromCharCode(65+j)}`);
              break;
            }
          }
        }
        
        inRecibidosDetailSection = true;
        continue;
      }

      // Si estamos en la sección de detalles de recibidos, procesar categorías
      if (inRecibidosDetailSection && firstCell.length > 5) {
        // Verificar si es una línea de categoría (tiene texto descriptivo y números)
        const categoria = firstCell;
        
        // Buscar valores en columnas F y G (índices 5 y 6)
        const asignados = (typeof row[5] === 'number') ? row[5] : 0;
        const reingresados = (typeof row[6] === 'number') ? row[6] : 0;

        if (asignados > 0 || reingresados > 0) {
          result.categorias[categoria] = { asignados, reingresados };
          console.log(`Found category: "${categoria}" - asignados: ${asignados}, reingresados: ${reingresados}`);
        }
      }

      // Detectar final de sección de recibidos
      if (inRecibidosDetailSection && firstCell.includes('III.')) {
        inRecibidosDetailSection = false;
      }
    }

    // Si no encontramos datos estructurados, usar método de fallback
    if (result.existentes === 0 && result.recibidos === 0) {
      console.log('No structured data found, using fallback method...');
      return this.parseSpreadsheetFallback(rows);
    }

    const totalCategorias = Object.keys(result.categorias).length;
    console.log(`Parsed structured data: existentes=${result.existentes}, recibidos=${result.recibidos}, categorías=${totalCategorias}`);
    
    return result;
  }

  /**
   * Método de fallback para parsing simple
   */
  private parseSpreadsheetFallback(rows: any[][]): {
    existentes: number;
    recibidos: number;
    reingresados: number;
    categorias: Record<string, { asignados: number; reingresados: number }>;
  } {
    // Buscar en todas las celdas números que podrían ser expedientes
    let expedientesRecibidos = 0;
    let expedientesExistentes = 0;
    let expedientesReingresados = 0;

    for (const row of rows) {
      for (const cell of row) {
        const num = Number(cell);
        if (!isNaN(num) && num > 0 && num < 10000) {
          // Heurística simple: asignar el primer número encontrado como recibidos
          if (expedientesRecibidos === 0) {
            expedientesRecibidos = num;
          } else if (expedientesExistentes === 0) {
            expedientesExistentes = num;
          } else if (expedientesReingresados === 0) {
            expedientesReingresados = num;
            break;
          }
        }
      }
      if (expedientesReingresados > 0) break;
    }

    return {
      existentes: expedientesExistentes,
      recibidos: expedientesRecibidos,
      reingresados: expedientesReingresados,
      categorias: {}
    };
  }

  /**
   * Parsear datos de hojas con estructura columnar (como "Datos")
   */
  private parseColumnarSheetData(rows: any[][], sheetName: string): EstadisticaData[] {
    const estadisticas: EstadisticaData[] = [];
    
    if (rows.length < 2) {
      console.warn(`Sheet ${sheetName} has no data rows`);
      return [];
    }

    // Primera fila contiene los encabezados
    const headers = (rows[0] || []).map((h: any) => h?.toString().toLowerCase().trim());
    const dataRows = rows.slice(1); // Excluir encabezados
    
    // Mapear índices de columnas
    const columnMap = {
      dependencia: this.findColumnIndex(headers, ['dependencia', 'dependenciasimple']),
      periodo: this.findColumnIndex(headers, ['periodo']),
      ingresos: this.findColumnIndex(headers, ['cantidad de ingresos', 'ingresos', 'recibidos']),
      resueltos: this.findColumnIndex(headers, ['cantidad de resueltos', 'resueltos']),
      tramite: this.findColumnIndex(headers, ['en trámite', 'tramite', 'en tramite'])
    };

    // Verificar que tenemos las columnas esenciales
    if (columnMap.dependencia === -1 || columnMap.periodo === -1 || columnMap.ingresos === -1) {
      console.warn(`Sheet ${sheetName} missing essential columns:`, {
        dependencia: columnMap.dependencia !== -1,
        periodo: columnMap.periodo !== -1,
        ingresos: columnMap.ingresos !== -1
      });
      return [];
    }

    // Procesar cada fila de datos
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] || [];
      
      try {
        const dependenciaNombre = row[columnMap.dependencia]?.toString().trim();
        const periodoValue = row[columnMap.periodo];
        const ingresosValue = row[columnMap.ingresos];
        
        // Saltar filas vacías o inválidas
        if (!dependenciaNombre || !periodoValue || ingresosValue === undefined) {
          continue;
        }

        // Convertir período de Excel a fecha
        const fechaPeriodo = this.convertExcelDateToPeriod(periodoValue);
        if (!fechaPeriodo) {
          console.warn(`Invalid period format in row ${i + 2}: ${periodoValue}`);
          continue;
        }

        // Extraer valores numéricos
        const expedientesRecibidos = this.parseNumericValue(ingresosValue);
        const expedientesResueltos = columnMap.resueltos !== -1 ? 
          this.parseNumericValue(row[columnMap.resueltos]) : 0;
        const expedientesEnTramite = columnMap.tramite !== -1 ? 
          this.parseNumericValue(row[columnMap.tramite]) : 0;

        // Crear registro de estadística
        const estadistica: EstadisticaData = {
          sheetId: sheetName,
          dependencia: dependenciaNombre,
          periodo: fechaPeriodo.periodo,
          fechaEstadistica: fechaPeriodo.fecha,
          expedientesExistentes: expedientesEnTramite, // En trámite = existentes
          expedientesRecibidos: expedientesRecibidos,
          expedientesReingresados: 0, // No disponible en esta estructura
          categoriasDetalle: {},
          metadatos: {
            fuenteDatos: `Google Sheets - ${sheetName}`
          }
        };

        estadisticas.push(estadistica);

      } catch (error) {
        console.warn(`Error processing row ${i + 2} in sheet ${sheetName}:`, error);
        continue;
      }
    }

    console.log(`Extracted ${estadisticas.length} statistics from sheet ${sheetName}`);
    return estadisticas;
  }

  /**
   * Encontrar el índice de una columna basado en nombres posibles
   */
  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (index !== -1) return index;
    }
    return -1;
  }

  /**
   * Convertir período a formato YYYYMM y fecha
   */
  private convertExcelDateToPeriod(periodoValue: any): { periodo: string; fecha: Date } | null {
    try {
      const periodoStr = periodoValue?.toString().trim();
      if (!periodoStr) return null;
      
      // Formato MM/YYYY (como "02/2024", "03/2024")
      const mmYyyyMatch = periodoStr.match(/^(\d{1,2})\/(\d{4})$/);
      if (mmYyyyMatch) {
        const month = parseInt(mmYyyyMatch[1]);
        const year = parseInt(mmYyyyMatch[2]);
        
        if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const periodo = `${year}${month.toString().padStart(2, '0')}`;
          const fecha = new Date(year, month - 1, 1); // month is 0-based in Date constructor
          return { periodo, fecha };
        }
      }
      
      // Formato YYYY-MM (como "2024-02", "2024-03") 
      const yyyyMmMatch = periodoStr.match(/^(\d{4})-(\d{1,2})$/);
      if (yyyyMmMatch) {
        const year = parseInt(yyyyMmMatch[1]);
        const month = parseInt(yyyyMmMatch[2]);
        
        if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const periodo = `${year}${month.toString().padStart(2, '0')}`;
          const fecha = new Date(year, month - 1, 1);
          return { periodo, fecha };
        }
      }
      
      // Formato YYYYMM directo (como "202402", "202403")
      const yyyymmMatch = periodoStr.match(/^(\d{4})(\d{2})$/);
      if (yyyymmMatch) {
        const year = parseInt(yyyymmMatch[1]);
        const month = parseInt(yyyymmMatch[2]);
        
        if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          const periodo = periodoStr;
          const fecha = new Date(year, month - 1, 1);
          return { periodo, fecha };
        }
      }
      
      // Intentar como número Excel si todo lo anterior falla
      const excelNumber = Number(periodoValue);
      if (!isNaN(excelNumber) && excelNumber > 40000 && excelNumber < 100000) {
        // Excel date starts from 1900-01-01 (but Excel treats 1900 as leap year incorrectly)
        const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
        const fecha = new Date(excelEpoch.getTime() + excelNumber * 24 * 60 * 60 * 1000);
        
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;
        const periodo = `${year}${month.toString().padStart(2, '0')}`;
        
        return { periodo, fecha };
      }
      
      return null;
    } catch (error) {
      console.warn(`Error parsing period: ${periodoValue}`, error);
      return null;
    }
  }

  /**
   * Parsear valor numérico de manera segura
   */
  private parseNumericValue(value: any): number {
    if (value === undefined || value === null || value === '') return 0;
    const numValue = Number(value);
    return isNaN(numValue) ? 0 : Math.floor(Math.abs(numValue));
  }

  /**
   * Parsear las filas del sheet y extraer estadísticas por dependencia (MÉTODO LEGACY)
   */
  private parseSheetRows(rows: any[][], sheetName: string): EstadisticaData[] {
    const estadisticas: EstadisticaData[] = [];
    const periodo = this.extractPeriodoFromSheetName(sheetName);
    
    if (periodo === 0) {
      console.warn(`Could not extract periodo from sheet name: ${sheetName}`);
      return [];
    }

    let currentDependencia: string | null = null;
    let fechaEstadistica: Date | undefined;
    let expedientesData: any = {};
    let categoriasDetalle: Record<string, { asignados: number; reingresados: number }> = {};

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      const firstCell = row[0]?.toString().trim() || '';

      // Detectar nombre de dependencia (líneas que contienen nombres largos)
      if (this.isDependenciaLine(firstCell)) {
        // Guardar dependencia anterior si existe
        if (currentDependencia && Object.keys(expedientesData).length > 0) {
          estadisticas.push(this.createEstadisticaRecord(
            sheetName,
            currentDependencia,
            periodo.toString(),
            fechaEstadistica,
            expedientesData,
            categoriasDetalle
          ));
        }

        // Iniciar nueva dependencia
        currentDependencia = this.cleanDependenciaName(firstCell);
        expedientesData = {};
        categoriasDetalle = {};
        continue;
      }

      // Detectar fecha de estadística
      if (firstCell.includes('ESTADISTICA AL:') || firstCell.includes('ESTADÍSTICA AL:')) {
        fechaEstadistica = this.extractFechaFromText(firstCell);
        continue;
      }

      // Detectar datos de expedientes principales
      if (firstCell.includes('EXPEDIENTES EXISTENTES') && row[1] != null) {
        expedientesData.existentes = this.extractNumber(row[1]);
      } else if (firstCell.includes('EXPEDIENTES RECIBIDOS') && row[1] != null) {
        expedientesData.recibidos = this.extractNumber(row[1]);
        if (row[2] != null) {
          expedientesData.reingresados = this.extractNumber(row[2]); // Columna de reingresados
        }
      }

      // Detectar categorías de expedientes
      if (this.isCategoriaLine(firstCell)) {
        const categoria = this.normalizeCategoriaName(firstCell);
        const asignados = row[1] != null ? this.extractNumber(row[1]) : 0;
        const reingresados = row[2] != null ? this.extractNumber(row[2]) : 0;
        
        if (categoria && (asignados > 0 || reingresados > 0)) {
          categoriasDetalle[categoria] = { asignados, reingresados };
        }
      }
    }

    // Guardar última dependencia
    if (currentDependencia && Object.keys(expedientesData).length > 0) {
      estadisticas.push(this.createEstadisticaRecord(
        sheetName,
        currentDependencia,
        periodo.toString(),
        fechaEstadistica,
        expedientesData,
        categoriasDetalle
      ));
    }

    return estadisticas;
  }

  /**
   * Crear registro de estadística
   */
  private createEstadisticaRecord(
    sheetId: string,
    dependencia: string,
    periodo: string,
    fechaEstadistica: Date | undefined,
    expedientesData: any,
    categoriasDetalle: Record<string, { asignados: number; reingresados: number }>
  ): EstadisticaData {
    return {
      sheetId,
      dependencia,
      periodo,
      fechaEstadistica: fechaEstadistica || new Date(), // Usar fecha actual si no se encuentra
      expedientesExistentes: expedientesData.existentes || 0,
      expedientesRecibidos: expedientesData.recibidos || 0,
      expedientesReingresados: expedientesData.reingresados || 0,
      categoriasDetalle,
      metadatos: {
        fuenteDatos: 'google_sheets',
      }
    };
  }

  /**
   * Detectar si una línea contiene nombre de dependencia
   */
  private isDependenciaLine(text: string): boolean {
    const indicators = [
      'CÁMARA FEDERAL',
      'CAMARA FEDERAL',
      'JUZGADO FEDERAL',
      'TRIBUNAL',
      'CORTE',
      'SECRETARÍA'
    ];

    return indicators.some(indicator => text.toUpperCase().includes(indicator)) &&
           text.length > 20 && // Nombres de dependencia son largos
           !text.includes('Juez:') && // Excluir líneas de jueces
           !text.includes('Secretaria:'); // Excluir líneas de secretarios
  }

  /**
   * Limpiar nombre de dependencia (remover jueces y secretarios)
   */
  private cleanDependenciaName(text: string): string {
    return text
      .replace(/Juez:.*$/i, '')
      .replace(/Secretaria:.*$/i, '')
      .replace(/Secretario:.*$/i, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Detectar si una línea es una categoría de expediente
   */
  private isCategoriaLine(text: string): boolean {
    const categoriaPatterns = [
      /^\d+\./,  // Líneas que empiezan con número
      /amparo/i,
      /jubilación/i,
      /pensiones/i,
      /prestaciones/i,
      /reajustes/i,
      /ejecución/i,
      /beneficio/i,
      /acción/i,
      /cobro/i,
      /información/i,
      /inconstitucionalidades/i
    ];

    return categoriaPatterns.some(pattern => pattern.test(text)) &&
           !text.toUpperCase().includes('EXPEDIENTES') &&
           text.length > 5;
  }

  /**
   * Normalizar nombre de categoría
   */
  private normalizeCategoriaName(text: string): string {
    return text
      .replace(/^\d+\./, '') // Remover números al inicio
      .replace(/\(.*\)/g, '') // Remover contenido entre paréntesis
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  /**
   * Extraer número de una celda
   */
  private extractNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/(\d+)/);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    }
    return 0;
  }

  /**
   * Extraer fecha del texto
   */
  private extractFechaFromText(text: string): Date | undefined {
    const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match && match[1] && match[2] && match[3]) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-based
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    return undefined;
  }

  /**
   * Extraer período del nombre del sheet
   */
  private extractPeriodoFromSheetName(sheetName: string): number {
    const match = sheetName.match(/(\d{6})/);
    if (match && match[1]) {
      const periodo = parseInt(match[1], 10);
      const year = Math.floor(periodo / 100);
      const month = periodo % 100;
      
      if (year >= 2005 && month >= 1 && month <= 12) {
        return periodo;
      }
    }
    return 0;
  }

  /**
   * Sincronizar datos desde Google Sheets a la base de datos
   */
  async syncToDatabase(sheetNames?: string[]): Promise<{
    procesados: number;
    insertados: number;
    actualizados: number;
    errores: string[];
  }> {
    if (!this.isAvailable()) {
      throw new Error('Google Sheets service not available');
    }

    const resultado = {
      procesados: 0,
      insertados: 0,
      actualizados: 0,
      errores: [] as string[]
    };

    try {
      // Si no se especifican sheets, obtener todos
      if (!sheetNames) {
        console.log('📑 Obteniendo lista de hojas disponibles...');
        const availableSheets = await this.listAvailableSheets();
        sheetNames = availableSheets.map(s => s.name);
        console.log(`📋 Se encontraron ${sheetNames.length} hojas para procesar`);
      }

      // Reset rate limiting counters before starting the sync
      this.requestsInLastMinute = 0;
      this.lastRequestTime = 0;
      this.rateLimitDelay = 1000;
      this.consecutiveRateLimitErrors = 0;

      for (const sheetName of sheetNames) {
        try {
          console.log(`\n🔄 Procesando sheet: ${sheetName}`);
          
          const estadisticas = await this.extractSheetData(sheetName);
          resultado.procesados += estadisticas.length;
          
          console.log(`📊 Procesando ${estadisticas.length} registros de estadísticas de ${sheetName}...`);

          for (const estadisticaData of estadisticas) {
            try {
              const inserted = await this.saveEstadisticaToDatabase(estadisticaData);
              if (inserted) {
                resultado.insertados++;
              } else {
                resultado.actualizados++;
              }
            } catch (error) {
              resultado.errores.push(`Error saving ${estadisticaData.dependencia}: ${(error as Error).message}`);
            }
          }

        } catch (error) {
          console.error(`❌ Error processing sheet ${sheetName}:`, error);
          resultado.errores.push(`Error processing sheet ${sheetName}: ${(error as Error).message}`);
        }
      }

      console.log(`✅ Sincronización completada: ${resultado.insertados} insertados, ${resultado.actualizados} actualizados`);
      
    } catch (error) {
      console.error('❌ Error in sync process:', error);
      throw error;
    }

    return resultado;
  }

  /**
   * Guardar estadística en la base de datos
   * @public - Expuesto para uso en sincronización incremental
   */
  async saveEstadisticaToDatabase(data: EstadisticaData): Promise<boolean> {
    const dependenciaRepo = AppDataSource.getRepository(Dependencia);
    const estadisticaRepo = AppDataSource.getRepository(Estadistica);

    // Buscar o crear dependencia
    let dependencia = await dependenciaRepo.findOne({
      where: { nombre: data.dependencia }
    });

    if (!dependencia) {
      dependencia = dependenciaRepo.create({
        nombre: data.dependencia,
        tipo: Dependencia.extraerTipo(data.dependencia),
        activa: true,
      });
      await dependenciaRepo.save(dependencia);
    }

    // Buscar estadística existente
    const existingEstadistica = await estadisticaRepo.findOne({
      where: {
        dependenciaId: dependencia.id,
        periodo: data.periodo,
      }
    });

    if (existingEstadistica) {
      // Actualizar existente
      Object.assign(existingEstadistica, {
        sheetId: data.sheetId,
        fechaEstadistica: data.fechaEstadistica,
        expedientesExistentes: data.expedientesExistentes,
        expedientesRecibidos: data.expedientesRecibidos,
        expedientesReingresados: data.expedientesReingresados,
        categoriasDetalle: data.categoriasDetalle,
        metadatos: data.metadatos,
      });
      
      await estadisticaRepo.save(existingEstadistica);
      return false; // No fue insertado, fue actualizado
    } else {
      // Crear nuevo
      const nuevaEstadistica = new Estadistica();
      nuevaEstadistica.sheetId = data.sheetId;
      nuevaEstadistica.dependenciaId = dependencia.id;
      nuevaEstadistica.periodo = data.periodo;
      if (data.fechaEstadistica) {
        nuevaEstadistica.fechaEstadistica = data.fechaEstadistica;
      }
      nuevaEstadistica.expedientesExistentes = data.expedientesExistentes;
      nuevaEstadistica.expedientesRecibidos = data.expedientesRecibidos;
      nuevaEstadistica.expedientesReingresados = data.expedientesReingresados;
      nuevaEstadistica.categoriasDetalle = data.categoriasDetalle;
      nuevaEstadistica.metadatos = {
        ...data.metadatos,
        fuenteDatos: 'google_sheets' as const
      };

      await estadisticaRepo.save(nuevaEstadistica);
      return true; // Fue insertado
    }
  }

  /**
   * Controlled request method with rate limiting and exponential backoff
   * @param requestFn The function that makes the API request
   * @returns The result of the API request
   */
  private async controlledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Reset counter if more than a minute has passed since the start of counting
    if (now - this.lastRequestTime > 60000) {
      this.requestsInLastMinute = 0;
    }
    
    // Check if we're about to hit the rate limit (Google Sheets API typically allows 60 requests per minute per user)
    if (this.requestsInLastMinute >= 50) {
      const timeToWait = 60000 - (now - this.lastRequestTime);
      if (timeToWait > 0) {
        console.log(`⏱️ Rate limit approaching, waiting ${timeToWait / 1000}s before next request...`);
        await this.delay(timeToWait);
      }
      this.requestsInLastMinute = 0;
      this.lastRequestTime = Date.now();
    }
    
    // Apply the current rate limit delay (increases with consecutive errors)
    if (this.rateLimitDelay > 0) {
      await this.delay(this.rateLimitDelay);
    }
    
    try {
      // Make the request
      this.requestsInLastMinute++;
      this.lastRequestTime = Date.now();
      const result = await requestFn();
      
      // Successful request - gradually reduce the delay if we had increased it due to errors
      if (this.consecutiveRateLimitErrors > 0) {
        this.consecutiveRateLimitErrors = 0;
        this.rateLimitDelay = Math.max(1000, Math.floor(this.rateLimitDelay / 2));
        console.log(`✅ Request successful, reducing delay to ${this.rateLimitDelay}ms`);
      }
      
      return result;
    } catch (error: any) {
      // Check if this is a rate limit error (429 Too Many Requests)
      if (error?.response?.status === 429 || error?.code === 429) {
        this.consecutiveRateLimitErrors++;
        
        // Apply exponential backoff
        this.rateLimitDelay = Math.min(
          this.MAX_RATE_LIMIT_DELAY,
          this.rateLimitDelay * Math.pow(2, this.consecutiveRateLimitErrors)
        );
        
        console.log(`⚠️ Rate limit exceeded (${this.consecutiveRateLimitErrors} consecutive errors). Increasing delay to ${this.rateLimitDelay}ms`);
        
        // Wait for the new delay time, then try again
        await this.delay(this.rateLimitDelay);
        console.log(`🔄 Retrying request after rate limit delay...`);
        return this.controlledRequest(requestFn);
      }
      
      // For other errors, just throw
      throw error;
    }
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verificar conectividad
   */
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.controlledRequest(() => this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId
      }));
      
      return true;

    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();