import 'dotenv/config';
import { google } from 'googleapis';
import { config } from '../config';

async function debugIndividualSpreadsheet() {
  console.log('🔍 Debug de spreadsheet individual...\n');

  try {
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: config.googleSheets.apiKey 
    });

    // Usar el primer ID que sabemos que funciona
    const testSpreadsheetId = '1FZggqNLJxkMlOjvsX7JFjls2eGU6_q9FvZ_YH3wt2Zc';
    
    console.log(`📊 Analizando spreadsheet: ${testSpreadsheetId}`);
    console.log();

    // Obtener información del spreadsheet
    const metaResponse = await sheets.spreadsheets.get({
      spreadsheetId: testSpreadsheetId
    });

    const sheetsList = metaResponse.data.sheets || [];
    console.log(`📄 Hojas encontradas: ${sheetsList.length}`);
    
    for (const sheet of sheetsList) {
      const sheetName = sheet.properties?.title || 'Unknown';
      console.log(`  - ${sheetName}`);
    }
    console.log();

    // Leer datos de la primera hoja
    const firstSheetName = sheetsList[0]?.properties?.title || 'Sheet1';
    console.log(`📖 Leyendo hoja: "${firstSheetName}"`);

    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: testSpreadsheetId,
      range: `${firstSheetName}!A1:Z50`, // Primeras 50 filas
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = dataResponse.data.values || [];
    console.log(`📊 Filas leídas: ${rows.length}`);
    console.log();

    // Mostrar estructura detallada
    console.log('📋 Estructura del documento:');
    console.log('─'.repeat(100));

    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i] || [];
      const firstCell = row[0]?.toString() || '';
      
      // Mostrar filas importantes
      if (firstCell.includes('EXPEDIENTES') || 
          firstCell.includes('Amparo') || 
          firstCell.includes('Jubilación') || 
          firstCell.includes('Pensiones') ||
          firstCell.length > 10) {
        
        console.log(`Fila ${i + 1}: "${firstCell}"`);
        
        // Mostrar todas las columnas para esta fila importante
        for (let j = 1; j < Math.min(row.length, 8); j++) {
          const cellValue = row[j];
          if (cellValue !== undefined && cellValue !== '') {
            const colLetter = String.fromCharCode(65 + j);
            console.log(`  ${colLetter}: ${cellValue} (tipo: ${typeof cellValue})`);
          }
        }
        console.log();
      }
    }

    // Buscar específicamente patrones de números
    console.log('\n🔢 Análisis de números encontrados:');
    console.log('─'.repeat(60));
    
    const numbersFound: Array<{row: number, col: string, value: number, context: string}> = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || [];
      const context = row[0]?.toString() || '';
      
      for (let j = 0; j < row.length; j++) {
        const cellValue = row[j];
        const num = Number(cellValue);
        
        if (!isNaN(num) && num > 0 && num < 20000) {
          const colLetter = String.fromCharCode(65 + j);
          numbersFound.push({
            row: i + 1,
            col: colLetter,
            value: num,
            context: context.substring(0, 30)
          });
        }
      }
    }

    // Mostrar números ordenados por valor
    numbersFound
      .sort((a, b) => b.value - a.value)
      .slice(0, 20) // Top 20
      .forEach(item => {
        console.log(`  ${item.value.toString().padStart(4)} en ${item.col}${item.row} - "${item.context}"`);
      });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar debug
debugIndividualSpreadsheet()
  .then(() => {
    console.log('\n✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en debug:', error);
    process.exit(1);
  });