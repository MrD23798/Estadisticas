// ===================================================================
// 🔎 SCRIPT: Sincronizar nuevos IDs desde hoja de "Datos Crudos"
// ===================================================================

import { AppDataSource } from '../config/database';
import { syncService } from '../services/sync.service';
import { config } from '../config';

async function runSyncNewIds() {
  const sheetName = process.argv[2] || 'Datos Crudos';
  console.log(`🚀 Iniciando sync de nuevos IDs desde hoja: ${sheetName}\n`);

  try {
    // Inicializar base de datos
    console.log('📊 Conectando a la base de datos...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Base de datos conectada\n');

    // Verificar configuración de Google Sheets
    if (!config.googleSheets.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
    }

    const hasApiKey = !!config.googleSheets.apiKey;
    const hasServiceAccount = !!(config.googleSheets.clientEmail && config.googleSheets.privateKey);
    if (!hasApiKey && !hasServiceAccount) {
      throw new Error('Google Sheets authentication not configured. Need either API Key or Service Account credentials');
    }

    // Ejecutar sync de nuevos IDs
    const resultado = await syncService.executeNewIdsSync(sheetName);

    console.log('\n📊 RESULTADOS:');
    console.log('=====================================');
    console.log(`✅ Éxito: ${resultado.success}`);
    console.log(`📦 Procesados: ${resultado.totalProcessed}`);
    console.log(`➕ Insertados: ${resultado.inserted}`);
    console.log(`🔄 Actualizados: ${resultado.updated}`);
    console.log(`⏱️ Duración: ${resultado.duration}ms`);

    if (resultado.errors && resultado.errors.length > 0) {
      console.log('\n⚠️ ERRORES:');
      resultado.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Sync completada!');

  } catch (error: any) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar
runSyncNewIds();