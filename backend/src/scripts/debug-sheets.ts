import 'dotenv/config';
import { google } from 'googleapis';
import { config } from '../config';

async function debugGoogleSheets() {
  console.log('🔍 Debug detallado de Google Sheets...\n');

  try {
    // Inicializar servicio con API Key
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: config.googleSheets.apiKey 
    });

    console.log('📊 Spreadsheet ID:', config.googleSheets.spreadsheetId);
    console.log('🔑 API Key configurada:', config.googleSheets.apiKey ? 'Sí' : 'No');
    console.log();

    // Obtener información completa del spreadsheet
    const response = await sheets.spreadsheets.get({
      spreadsheetId: config.googleSheets.spreadsheetId
    });

    console.log('📋 Información del Spreadsheet:');
    console.log('  Título:', response.data.properties?.title);
    console.log('  Locale:', response.data.properties?.locale);
    console.log('  TimeZone:', response.data.properties?.timeZone);
    console.log();

    const sheetsList = response.data.sheets || [];
    console.log(`📄 Total de hojas encontradas: ${sheetsList.length}`);
    console.log();

    // Listar TODAS las hojas sin filtros
    if (sheetsList.length > 0) {
      console.log('📋 Detalle de cada hoja:');
      console.log('─'.repeat(80));
      
      for (let i = 0; i < sheetsList.length; i++) {
        const sheet = sheetsList[i];
        if (!sheet) continue;
        const props = sheet.properties;
        
        console.log(`${i + 1}. Hoja: "${props?.title}"`);
        console.log(`   ID: ${props?.sheetId}`);
        console.log(`   Tipo: ${props?.sheetType || 'GRID'}`);
        console.log(`   Filas: ${props?.gridProperties?.rowCount || 'N/A'}`);
        console.log(`   Columnas: ${props?.gridProperties?.columnCount || 'N/A'}`);
        console.log(`   Oculta: ${props?.hidden ? 'Sí' : 'No'}`);
        console.log();

        // Intentar leer algunas celdas de muestra de cada hoja
        try {
          const sampleRange = `${props?.title}!A1:E10`;
          const sampleResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: config.googleSheets.spreadsheetId,
            range: sampleRange,
            valueRenderOption: 'UNFORMATTED_VALUE'
          });

          const sampleRows = sampleResponse.data.values || [];
          console.log(`   📊 Datos de muestra (primeras ${sampleRows.length} filas):`);
          
          if (sampleRows.length === 0) {
            console.log('     ⚠️ Esta hoja está vacía');
          } else {
            sampleRows.slice(0, 3).forEach((row, idx) => {
              const rowPreview = row.map((cell: any) => 
                cell?.toString().substring(0, 20) + (cell?.toString().length > 20 ? '...' : '')
              ).join(' | ');
              console.log(`     Fila ${idx + 1}: ${rowPreview}`);
            });
            
            if (sampleRows.length > 3) {
              console.log(`     ... y ${sampleRows.length - 3} filas más`);
            }
          }
        } catch (sampleError) {
          console.log(`     ❌ Error leyendo datos: ${(sampleError as Error).message}`);
        }
        
        console.log('─'.repeat(80));
        console.log();
      }
    } else {
      console.log('⚠️ No se encontraron hojas en este spreadsheet');
      console.log();
      console.log('🔍 Posibles causas:');
      console.log('1. El Spreadsheet ID es incorrecto');
      console.log('2. El spreadsheet no existe o fue eliminado');
      console.log('3. No tienes permisos para ver las hojas');
      console.log('4. La API Key no tiene acceso a Google Sheets API');
    }

  } catch (error) {
    console.error('❌ Error completo:', error);
    console.log();
    console.log('🔍 Información de debug:');
    console.log('Error type:', (error as any).constructor.name);
    console.log('Error message:', (error as Error).message);
    
    if ((error as any).response) {
      console.log('HTTP Status:', (error as any).response.status);
      console.log('HTTP Status Text:', (error as any).response.statusText);
      console.log('Response data:', (error as any).response.data);
    }
  }
}

// Ejecutar debug
debugGoogleSheets()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en debug:', error);
    process.exit(1);
  });