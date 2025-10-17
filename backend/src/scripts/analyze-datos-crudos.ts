import 'dotenv/config';
import { google } from 'googleapis';
import { config } from '../config';

async function analyzeDatosCrudos() {
  console.log('🔍 Analizando hoja "Datos Crudos" en detalle...\n');

  try {
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: config.googleSheets.apiKey 
    });

    // Leer más datos de la hoja "Datos Crudos"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: 'Datos Crudos!A1:Z50', // Primeras 50 filas
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
        console.log(`  Columna ${String.fromCharCode(65 + index)}: "${header}"`);
      });
      console.log();

      // Mostrar algunas filas de ejemplo
      console.log('📖 Datos de ejemplo (primeras 10 filas):');
      console.log('─'.repeat(120));
      
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i] || [];
        console.log(`Fila ${i + 1}:`);
        
        // Mostrar solo las primeras 8 columnas más importantes
        for (let j = 0; j < Math.min(8, headers.length); j++) {
          const header = headers[j] || `Col${j + 1}`;
          const value = row[j] || '';
          console.log(`  ${header}: ${value}`);
        }
        console.log('─'.repeat(60));
      }

      // Analizar tipos de dependencias
      console.log('\n📊 Análisis de dependencias:');
      
      // Buscar columnas que contengan información de dependencias
      const dependenciaColumns = headers.map((header, index) => ({
        index,
        header: header?.toString() || '',
        type: header?.toString().toLowerCase()
      })).filter(col => 
        col.type.includes('dependencia') || 
        col.type.includes('juzgado') || 
        col.type.includes('sala') ||
        col.type.includes('plantilla')
      );

      console.log('🏛️ Columnas de dependencias encontradas:');
      dependenciaColumns.forEach(col => {
        console.log(`  Columna ${String.fromCharCode(65 + col.index)}: "${col.header}"`);
        
        // Mostrar valores únicos de esta columna
        const uniqueValues = new Set(
          rows.slice(1, 20).map(row => row[col.index]).filter(Boolean)
        );
        
        console.log(`    Valores de muestra (${uniqueValues.size} únicos):`);
        Array.from(uniqueValues).slice(0, 5).forEach(val => {
          console.log(`      - ${val}`);
        });
        if (uniqueValues.size > 5) {
          console.log(`      ... y ${uniqueValues.size - 5} más`);
        }
        console.log();
      });

      // Buscar IDs
      const idColumns = headers.map((header, index) => ({
        index,
        header: header?.toString() || ''
      })).filter(col => 
        col.header.toLowerCase().includes('id') ||
        col.header.toLowerCase().includes('original')
      );

      console.log('🆔 Columnas de IDs encontradas:');
      idColumns.forEach(col => {
        console.log(`  Columna ${String.fromCharCode(65 + col.index)}: "${col.header}"`);
        
        // Mostrar algunos valores de ID
        const sampleIds = rows.slice(1, 10).map(row => row[col.index]).filter(Boolean);
        console.log(`    Valores de muestra:`);
        sampleIds.slice(0, 5).forEach(id => {
          console.log(`      - ${id}`);
        });
        console.log();
      });

    } else {
      console.log('⚠️ La hoja "Datos Crudos" está vacía');
    }

  } catch (error) {
    console.error('❌ Error analizando hoja "Datos Crudos":', error);
  }
}

// Ejecutar análisis
analyzeDatosCrudos()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en análisis:', error);
    process.exit(1);
  });