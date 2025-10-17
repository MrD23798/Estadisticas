import 'reflect-metadata';
import { buildApp, closeApp } from './app';
import { config, validateConfig } from './config';

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor backend...');
    console.log(`📊 Ambiente: ${config.app.environment}`);
    
    // Validar configuración
    validateConfig();
    console.log('✅ Configuración validada');

    // Construir y configurar la aplicación
    const app = await buildApp();
    console.log('✅ Aplicación configurada');

    // Iniciar el servidor
    const address = await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log('');
    console.log('🎉 ¡Servidor iniciado exitosamente!');
    console.log(`🌐 Servidor corriendo en: ${address}`);
    console.log(`📋 Health check: ${address}/health`);
    console.log(`ℹ️  Información: ${address}/info`);
    console.log(`🔧 API: ${address}/api`);
    console.log('');
    console.log('📊 Características:');
    console.log(`   📁 Base de datos: MySQL (${config.database.host}:${config.database.port})`);
    console.log(`   🔄 Sincronización: ${config.sync.enabled ? 'Habilitada' : 'Deshabilitada'}`);
    console.log(`   📑 Google Sheets: ${config.googleSheets.enabled ? 'Configurado' : 'No configurado'}`);
    console.log(`   💾 Cache: ${config.cache.enabled ? 'Habilitado' : 'Deshabilitado'}`);
    console.log('');

    // Iniciar sincronización automática con Google Sheets (si está habilitada)
    if (config.sync.enabled && config.googleSheets.enabled && config.app.environment === 'development') {
      console.log('');
      console.log('🔄 INICIANDO SINCRONIZACIÓN AUTOMÁTICA CON GOOGLE SHEETS...');
      console.log('');
      
      // Delay la sincronización por 2 segundos para dar tiempo a que el servidor se estabilice
      setTimeout(() => {
        // Importar el servicio asíncronamente para evitar dependencias circulares
        import('./services/estadisticas.service').then(async ({ estadisticasService }) => {
          try {
            console.log('');
            console.log('� DETALLES DE SINCRONIZACIÓN:');
            console.log('----------------------------------');
            console.log('✓ Modo: Sincronización automática');
            console.log('✓ Forzar actualización: Sí');
            console.log('✓ Eliminar existentes: No');
            console.log('✓ Google Sheets API: Habilitada');
            console.log('✓ Rate Limiting: Habilitado (protección contra cuotas excedidas)');
            console.log('----------------------------------');
            console.log('');
            
            console.log('🔄 Iniciando proceso de sincronización...');
            
            // Se realiza la sincronización con control de errores mejorado
            const resultado = await estadisticasService.sincronizar({
              forzar: true,
              eliminarExistentes: false,
            });
            
            console.log('');
            console.log('✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE');
            console.log('----------------------------------');
            console.log(`✓ Registros procesados: ${resultado.registrosProcesados || 0}`);
            console.log(`✓ Registros actualizados: ${resultado.registrosActualizados || 0}`);
            console.log(`✓ Registros insertados: ${resultado.registrosInsertados || 0}`);
            
            if (resultado.errores && resultado.errores.length > 0) {
              console.log(`⚠️ Errores encontrados: ${resultado.errores.length}`);
              console.log('----------------------------------');
              resultado.errores.slice(0, 5).forEach((err, i) => {
                console.log(`${i+1}. ${err}`);
              });
              
              if (resultado.errores.length > 5) {
                console.log(`... y ${resultado.errores.length - 5} errores más`);
              }
            }
            
            console.log('----------------------------------');
            
          } catch (error) {
            console.error('\n❌ ERROR EN SINCRONIZACIÓN AUTOMÁTICA:');
            console.error('----------------------------------');
            console.error(error);
            console.error('----------------------------------');
            console.error('👉 Puede ejecutar la sincronización manualmente usando el endpoint /api/sincronizar');
            console.error('');
          }
        });
      }, 2000); // 2 segundos de retraso
    }

    // Configurar manejo de señales de cierre
    const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
    
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n📴 Recibida señal ${signal}, cerrando servidor...`);
        
        try {
          await closeApp(app);
          console.log('✅ Servidor cerrado correctamente');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error cerrando servidor:', error);
          process.exit(1);
        }
      });
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('En la promesa:', promise);
      process.exit(1);
    });

    return app;

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    
    // Mostrar información adicional en desarrollo
    if (config.app.environment === 'development') {
      console.error('Stack trace:', (error as Error).stack);
    }
    
    process.exit(1);
  }
}

// Función para mostrar información de configuración
function showConfigInfo() {
  console.log('� Información de configuración:');
  console.log(`   Ambiente: ${config.app.environment}`);
  console.log(`   Puerto: ${config.server.port}`);
  console.log(`   Host: ${config.server.host}`);
  console.log(`   Base de datos: ${config.database.host}:${config.database.port}/${config.database.database}`);
  console.log(`   Log level: ${config.app.logLevel}`);
  console.log('');
}

// Función para verificar dependencias
function checkDependencies() {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_USER', 
    'DB_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('');
    console.error('💡 Asegúrate de tener un archivo .env con todas las variables requeridas');
    return false;
  }

  return true;
}

// Iniciar servidor si se ejecuta directamente
if (require.main === module) {
  // Mostrar información inicial
  console.log('═══════════════════════════════════════');
  console.log('  📊 ESTADÍSTICAS BACKEND API');
  console.log('  🏗️  TypeORM + Fastify + tRPC + MySQL');
  console.log('═══════════════════════════════════════');
  console.log('');

  // Verificar dependencias
  if (!checkDependencies()) {
    process.exit(1);
  }

  // Mostrar configuración en desarrollo
  if (config.app.environment === 'development') {
    showConfigInfo();
  }

  // Iniciar servidor
  startServer();
}

export { startServer, buildApp };