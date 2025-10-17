// ===================================================================
// 🔧 CONFIGURADOR DE GOOGLE SHEETS
// ===================================================================
// Este script te ayuda a configurar y probar la conexión con Google Sheets

import { google } from 'googleapis';
import { config } from '../config';

export class GoogleSheetsConfigurator {
  private auth: any;
  private sheets: any;

  constructor() {
    console.log('🔧 Inicializando configurador de Google Sheets...');
    this.initializeAuth();
  }

  private initializeAuth() {
    try {
      // Crear autenticación usando service account
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.googleSheets.clientEmail,
          private_key: config.googleSheets.privateKey?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Autenticación configurada correctamente');
    } catch (error) {
      console.error('❌ Error configurando autenticación:', error);
      throw new Error('No se pudo configurar la autenticación de Google Sheets');
    }
  }

  /**
   * 🧪 Probar conexión con Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Probando conexión con Google Sheets...');
      
      if (!config.googleSheets.spreadsheetId) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
      }

      // Intentar obtener metadatos de la hoja
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
      });

      console.log('✅ Conexión exitosa!');
      console.log(`📊 Hoja: ${response.data.properties?.title}`);
      console.log(`📋 Sheets disponibles: ${response.data.sheets?.length}`);
      
      return true;
    } catch (error: any) {
      console.error('❌ Error en conexión:', error.message);
      return false;
    }
  }

  /**
   * 📋 Listar todas las hojas disponibles
   */
  async listAvailableSheets(): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
      });

      const sheets = response.data.sheets || [];
      
      console.log('\n📋 HOJAS DISPONIBLES:');
      console.log('=====================================');
      
      sheets.forEach((sheet: any, index: number) => {
        const properties = sheet.properties;
        console.log(`${index + 1}. ${properties.title}`);
        console.log(`   - ID: ${properties.sheetId}`);
        console.log(`   - Filas: ${properties.gridProperties?.rowCount}`);
        console.log(`   - Columnas: ${properties.gridProperties?.columnCount}`);
        console.log('   ---');
      });

    } catch (error) {
      console.error('❌ Error listando hojas:', error);
    }
  }

  /**
   * 🔍 Buscar hojas que coincidan con el patrón de fechas
   */
  async findDataSheets(): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
      });

      const sheets = response.data.sheets || [];
      const dataSheets: string[] = [];
      
      // Buscar hojas que coincidan con patrón YYYYMM
      const datePattern = /\b(20\d{2})(0[1-9]|1[0-2])\b/;
      
      sheets.forEach((sheet: any) => {
        const title = sheet.properties.title;
        if (datePattern.test(title)) {
          dataSheets.push(title);
        }
      });

      console.log('\n🔍 HOJAS CON DATOS ENCONTRADAS:');
      console.log('=====================================');
      dataSheets.forEach((sheetName, index) => {
        console.log(`${index + 1}. ${sheetName}`);
      });

      return dataSheets;
    } catch (error) {
      console.error('❌ Error buscando hojas de datos:', error);
      return [];
    }
  }

  /**
   * 📊 Obtener vista previa de datos de una hoja
   */
  async previewSheetData(sheetName: string): Promise<void> {
    try {
      console.log(`\n📊 VISTA PREVIA DE: ${sheetName}`);
      console.log('=====================================');

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${sheetName}!A1:Z10`, // Primeras 10 filas
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.log('⚠️ No hay datos en esta hoja');
        return;
      }

      // Mostrar encabezados
      if (rows[0]) {
        console.log('ENCABEZADOS:');
        rows[0].forEach((header: string, index: number) => {
          console.log(`  ${String.fromCharCode(65 + index)}: ${header}`);
        });
        console.log('');
      }

      // Mostrar primeras filas de datos
      console.log('PRIMERAS FILAS:');
      rows.slice(1, 6).forEach((row: any[], index: number) => {
        console.log(`Fila ${index + 2}:`, row.slice(0, 5)); // Solo primeras 5 columnas
      });

    } catch (error) {
      console.error(`❌ Error obteniendo datos de ${sheetName}:`, error);
    }
  }

  /**
   * 🚀 Ejecutar configuración completa
   */
  async runFullSetup(): Promise<void> {
    console.log('\n🚀 INICIANDO CONFIGURACIÓN COMPLETA DE GOOGLE SHEETS');
    console.log('=====================================================\n');

    // 1. Probar conexión
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log('\n❌ No se pudo establecer conexión. Verifica:');
      console.log('1. GOOGLE_SHEETS_SPREADSHEET_ID está configurado');
      console.log('2. GOOGLE_SHEETS_CLIENT_EMAIL es correcto'); 
      console.log('3. GOOGLE_SHEETS_PRIVATE_KEY está bien formateado');
      console.log('4. La cuenta de servicio tiene acceso a la hoja');
      return;
    }

    // 2. Listar hojas disponibles
    await this.listAvailableSheets();

    // 3. Buscar hojas con datos
    const dataSheets = await this.findDataSheets();

    // 4. Vista previa de algunas hojas
    if (dataSheets.length > 0) {
      console.log('\n📊 Obteniendo vista previa de las primeras hojas...');
      for (const sheetName of dataSheets.slice(0, 3)) {
        await this.previewSheetData(sheetName);
      }
    }

    console.log('\n✅ CONFIGURACIÓN COMPLETADA');
    console.log('=====================================');
    console.log('Ahora puedes usar el syncService para sincronizar datos!');
  }
}

// Script ejecutable
async function main() {
  try {
    const configurator = new GoogleSheetsConfigurator();
    await configurator.runFullSetup();
  } catch (error) {
    console.error('❌ Error en configuración:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}