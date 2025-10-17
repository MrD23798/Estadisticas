// ===================================================================
// 🔄 SCRIPT DE SINCRONIZACIÓN MANUAL
// ===================================================================
// Ejecuta sincronización completa desde Google Sheets

import { AppDataSource } from '../config/database';
import { syncService } from '../services/sync.service';
import { config } from '../config';

async function runSync() {
  console.log('🚀 Iniciando sincronización manual desde Google Sheets...\n');

  try {
    // 1. Inicializar base de datos
    console.log('📊 Conectando a la base de datos...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Base de datos conectada\n');

    // 2. Verificar configuración
    console.log('🔧 Verificando configuración...');
    if (!config.googleSheets.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID no está configurado');
    }
    
    // Verificar que tengamos al menos una forma de autenticación
    const hasApiKey = !!config.googleSheets.apiKey;
    const hasServiceAccount = !!(config.googleSheets.clientEmail && config.googleSheets.privateKey);
    
    if (!hasApiKey && !hasServiceAccount) {
      throw new Error('Google Sheets authentication not configured. Need either API Key or Service Account credentials');
    }
    
    if (hasApiKey) {
      console.log('✅ Configuración verificada (API Key)\n');
    } else {
      console.log('✅ Configuración verificada (Service Account)\n');
    }

    // 3. Ejecutar sincronización completa
    console.log('🔄 Ejecutando sincronización completa...');
    const resultado = await syncService.executeFullSync();

    // 4. Mostrar resultados
    console.log('\n📊 RESULTADOS DE SINCRONIZACIÓN:');
    console.log('=====================================');
    console.log(`✅ Éxito: ${resultado.success}`);
    console.log(`� Registros procesados: ${resultado.totalProcessed}`);
    console.log(`➕ Registros insertados: ${resultado.inserted}`);
    console.log(`🔄 Registros actualizados: ${resultado.updated}`);
    console.log(`⏱️ Duración: ${resultado.duration}ms`);

    if (resultado.errors && resultado.errors.length > 0) {
      console.log('\n⚠️ ERRORES ENCONTRADOS:');
      resultado.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Sincronización completada!');

  } catch (error: any) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    
    if (error.message.includes('GOOGLE_SHEETS') || error.message.includes('authentication')) {
      console.log('\n💡 Para configurar Google Sheets:');
      console.log('OPCIÓN 1 - API Key (recomendado):');
      console.log('1. Agrega GOOGLE_SHEETS_API_KEY a tu .env');
      console.log('2. Haz tu hoja pública');
      console.log('');
      console.log('OPCIÓN 2 - Service Account:');
      console.log('1. Ejecuta: npm run setup-sheets');
      console.log('2. Configura las variables en .env');
      console.log('3. Comparte la hoja con la cuenta de servicio');
    }
    
    process.exit(1);
  } finally {
    // Cerrar conexión de base de datos
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar sincronización
runSync();