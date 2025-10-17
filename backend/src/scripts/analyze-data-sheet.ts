import 'dotenv/config';
import { google } from 'googleapis';
import { config } from '../config';

async function analyzeDataSheet() {
  console.log('🔍 Analizando hoja "Datos" en detalle...\n');

  try {
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: config.googleSheets.apiKey 
    });

    // Leer más datos de la hoja "Datos"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: 'Datos!A1:Z50', // Primeras 50 filas
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = response.data.values || [];
    
    console.log(`📊 Total de filas leídas: ${rows.length}`);
    console.log();

    if (rows.length > 0) {
      // Analizar encabezados
      const headers = rows[0] || [];
      console.log('📋 Encabezados encontrados:');
      headers.forEach((header, index) => {
        console.log(`  Columna ${index + 1}: "${header}"`);
      });
      console.log();

      // Mostrar algunas filas de ejemplo
      console.log('📖 Datos de ejemplo (primeras 10 filas):');
      console.log('─'.repeat(120));
      
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i] || [];
        console.log(`Fila ${i + 1}:`);
        
        // Mostrar cada columna con su encabezado
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || '';
          console.log(`  ${header}: ${value}`);
        });
        console.log('─'.repeat(60));
      }

      // Analizar estructura de datos
      console.log('\n📊 Análisis de datos:');
      
      if (rows.length > 1) {
        const dataRows = rows.slice(1); // Excluir encabezados
        
        // Analizar dependencias únicas
        const dependenciasCol = headers.findIndex(h => 
          h.toLowerCase().includes('dependencia')
        );
        
        if (dependenciasCol >= 0) {
          const dependencias = new Set(
            dataRows.map(row => row[dependenciasCol]).filter(Boolean)
          );
          console.log(`  📍 Dependencias únicas: ${dependencias.size}`);
          console.log('  📋 Lista de dependencias:');
          Array.from(dependencias).slice(0, 10).forEach(dep => {
            console.log(`    - ${dep}`);
          });
          if (dependencias.size > 10) {
            console.log(`    ... y ${dependencias.size - 10} más`);
          }
        }
        
        // Analizar períodos
        const periodoCol = headers.findIndex(h => 
          h.toLowerCase().includes('periodo')
        );
        
        if (periodoCol >= 0) {
          const periodos = new Set(
            dataRows.map(row => row[periodoCol]).filter(Boolean)
          );
          console.log(`\n  📅 Períodos únicos: ${periodos.size}`);
          console.log('  📋 Lista de períodos:');
          Array.from(periodos).slice(0, 10).forEach(periodo => {
            console.log(`    - ${periodo}`);
          });
          if (periodos.size > 10) {
            console.log(`    ... y ${periodos.size - 10} más`);
          }
        }
        
        // Buscar columnas numéricas (expedientes)
        const numericColumns = headers.filter((header, index) => {
          if (index === 0) return false; // Skip first column
          const sampleValues = dataRows.slice(0, 5).map(row => row[index]);
          return sampleValues.some(val => !isNaN(Number(val)) && val !== '');
        });
        
        console.log(`\n  🔢 Columnas numéricas encontradas: ${numericColumns.length}`);
        numericColumns.forEach(col => {
          console.log(`    - ${col}`);
        });
      }
    } else {
      console.log('⚠️ La hoja "Datos" está vacía');
    }

  } catch (error) {
    console.error('❌ Error analizando hoja "Datos":', error);
  }
}

// Ejecutar análisis
analyzeDataSheet()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en análisis:', error);
    process.exit(1);
  });