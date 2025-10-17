#!/usr/bin/env node

/**
 * Script de prueba para verificar la sincronización con Google Sheets
 * 
 * Uso:
 * npm run test-sync
 * o
 * tsx scripts/test-sync.ts
 */

import dotenv from 'dotenv';
import { SyncService } from '../src/services/sync.service';

// Cargar variables de entorno
dotenv.config();

async function testSyncConfiguration() {
  console.log('🧪 Iniciando prueba de configuración de sincronización...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Verificando variables de entorno:');
  const requiredEnvVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SPREADSHEET_ID',
    'SYNC_SECRET_KEY'
  ];

  let envConfigOk = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const status = value ? '✅' : '❌';
    const displayValue = envVar.includes('KEY') || envVar.includes('SECRET') 
      ? (value ? '[CONFIGURADO]' : '[FALTANTE]')
      : (value || '[FALTANTE]');
    
    console.log(`  ${status} ${envVar}: ${displayValue}`);
    
    if (!value) {
      envConfigOk = false;
    }
  }

  if (!envConfigOk) {
    console.log('\n❌ Configuración incompleta. Por favor configura todas las variables de entorno.');
    console.log('📖 Revisa el archivo SYNC_README.md para más detalles.');
    process.exit(1);
  }

  console.log('\n✅ Variables de entorno configuradas correctamente\n');

  // 2. Probar conexión con Google Sheets
  console.log('🔗 Probando conexión con Google Sheets...');
  
  try {
    const syncService = new SyncService();
    console.log('✅ SyncService inicializado correctamente');

    // Intentar obtener información de las hojas
    console.log('📊 Obteniendo información de hojas disponibles...');
    
    try {
      // Accedemos al método privado para prueba
      const reportIndex = await (syncService as any).fetchReportIndex();
      
      console.log(`✅ Conectividad exitosa - Encontradas ${reportIndex.length} hojas`);
      
      if (reportIndex.length > 0) {
        console.log('\n📋 Hojas disponibles:');
        reportIndex.forEach((report: any, index: number) => {
          console.log(`  ${index + 1}. ${report.sheetId} - ${report.dependencyName}`);
        });
      } else {
        console.log('⚠️  No se encontraron hojas en el índice');
        console.log('   Verifica que tengas una hoja llamada "Índice" con datos');
      }

    } catch (error) {
      console.log('❌ Error obteniendo hojas:', (error as Error).message);
      console.log('   Posibles causas:');
      console.log('   - El Service Account no tiene permisos');
      console.log('   - El Spreadsheet ID es incorrecto');
      console.log('   - No existe la hoja "Índice"');
    }

  } catch (error) {
    console.log('❌ Error inicializando SyncService:', (error as Error).message);
    console.log('   Verifica las credenciales de Google Sheets');
  }

  console.log('\n🧪 Prueba completada');
}

async function testAPIEndpoint() {
  console.log('\n🌐 Probando endpoint de estado...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3000/api/admin/sync/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.SYNC_SECRET_KEY
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint respondiendo correctamente');
      console.log('📊 Estado:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Error HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.log('❌ Error conectando al servidor:', (error as Error).message);
    console.log('   ¿Está el servidor ejecutándose en puerto 3000?');
  }
}

// Función principal
async function main() {
  try {
    await testSyncConfiguration();
    
    // Solo probar el endpoint si se especifica
    if (process.argv.includes('--test-api')) {
      await testAPIEndpoint();
    } else {
      console.log('\n💡 Para probar el endpoint API, ejecuta:');
      console.log('   tsx scripts/test-sync.ts --test-api');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { testSyncConfiguration, testAPIEndpoint };