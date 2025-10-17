// Script para depurar la conexión con el backend API
// Este script puede ejecutarse en la consola del navegador para diagnosticar problemas
// de conexión con la API del backend.

/**
 * Interfaces para las respuestas de la API
 */
interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database?: {
    connected: boolean;
    info?: Record<string, unknown>;
  };
  features?: {
    googleSheets: boolean;
    sync: boolean;
    cache: boolean;
  };
}

interface PeriodosResponse {
  periodos: string[];
}

interface DependenciaInfo {
  nombre: string;
  codigo?: string;
}

interface DependenciasResponse {
  dependencias: DependenciaInfo[];
}

/**
 * Diagnostica la conexión a la API del backend
 */
async function diagnosticarAPI(): Promise<void> {
  console.log('%c📡 DIAGNÓSTICO DE CONEXIÓN API', 'font-size: 14px; font-weight: bold; color: blue');
  console.log('='.repeat(50));

  // 1. Verificar configuración
  const apiBase = (import.meta.env?.VITE_API_BASE_URL as string) || window.location.origin;
  console.log(`%c1. Configuración:`, 'font-weight: bold');
  console.log(`  • Base URL: ${apiBase}`);
  console.log(`  • Fecha/Hora: ${new Date().toISOString()}`);
  console.log(`  • Navegador: ${navigator.userAgent}`);
  console.log('');

  // 2. Health check
  console.log(`%c2. Health Check:`, 'font-weight: bold');
  try {
    const startHealth = performance.now();
    const healthResponse = await fetch(`${apiBase}/health`);
    const healthTime = (performance.now() - startHealth).toFixed(1);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json() as HealthResponse;
      console.log(`  • %c✅ Health check exitoso (${healthTime}ms)`, 'color: green');
      console.log(`  • Status: ${healthData.status}`);
      console.log(`  • Versión: ${healthData.version}`);
      console.log(`  • Ambiente: ${healthData.environment}`);
      
      if (healthData.database) {
        console.log(`  • Base de datos: ${healthData.database.connected ? '✅ Conectada' : '❌ Desconectada'}`);
      }
      
      if (healthData.features) {
        console.log(`  • Google Sheets: ${healthData.features.googleSheets ? '✅ Habilitado' : '❌ Deshabilitado'}`);
        console.log(`  • Sincronización: ${healthData.features.sync ? '✅ Habilitada' : '❌ Deshabilitada'}`);
        console.log(`  • Cache: ${healthData.features.cache ? '✅ Habilitado' : '❌ Deshabilitado'}`);
      }
    } else {
      console.log(`  • %c❌ Health check fallido: ${healthResponse.status} ${healthResponse.statusText}`, 'color: red');
    }
  } catch (error) {
    console.log(`  • %c❌ Error en health check: ${error instanceof Error ? error.message : String(error)}`, 'color: red');
  }
  console.log('');

  // 3. Probar periodos
  console.log(`%c3. API Periodos:`, 'font-weight: bold');
  try {
    const startPeriodos = performance.now();
    const periodosResponse = await fetch(`${apiBase}/api/estadisticas/periodos`);
    const periodosTime = (performance.now() - startPeriodos).toFixed(1);

    if (periodosResponse.ok) {
      const periodosData = await periodosResponse.json() as PeriodosResponse;
      const numPeriodos = periodosData.periodos?.length || 0;
      console.log(`  • %c✅ Periodos obtenidos (${periodosTime}ms)`, 'color: green');
      console.log(`  • Total periodos: ${numPeriodos}`);
      if (numPeriodos > 0) {
        console.log(`  • Primeros 5: ${periodosData.periodos.slice(0, 5).join(', ')}`);
      }
    } else {
      console.log(`  • %c❌ Error en periodos: ${periodosResponse.status} ${periodosResponse.statusText}`, 'color: red');
    }
  } catch (error) {
    console.log(`  • %c❌ Error en periodos: ${error instanceof Error ? error.message : String(error)}`, 'color: red');
  }
  console.log('');

  // 4. Probar dependencias
  console.log(`%c4. API Dependencias:`, 'font-weight: bold');
  try {
    const startDependencias = performance.now();
    const dependenciasResponse = await fetch(`${apiBase}/api/estadisticas/dependencias`);
    const dependenciasTime = (performance.now() - startDependencias).toFixed(1);

    if (dependenciasResponse.ok) {
      const dependenciasData = await dependenciasResponse.json() as DependenciasResponse;
      const numDependencias = dependenciasData.dependencias?.length || 0;
      console.log(`  • %c✅ Dependencias obtenidas (${dependenciasTime}ms)`, 'color: green');
      console.log(`  • Total dependencias: ${numDependencias}`);
      if (numDependencias > 0) {
        console.log(`  • Primeras 3: ${dependenciasData.dependencias.slice(0, 3).map((d: DependenciaInfo) => d.nombre).join(', ')}`);
      }
    } else {
      console.log(`  • %c❌ Error en dependencias: ${dependenciasResponse.status} ${dependenciasResponse.statusText}`, 'color: red');
    }
  } catch (error) {
    console.log(`  • %c❌ Error en dependencias: ${error instanceof Error ? error.message : String(error)}`, 'color: red');
  }
  console.log('');

  // 5. CORS
  console.log(`%c5. Diagnóstico CORS:`, 'font-weight: bold');
  const origin = window.location.origin;
  console.log(`  • Origen actual: ${origin}`);
  console.log(`  • API base: ${apiBase}`);
  
  if (origin === apiBase) {
    console.log(`  • %c✅ Mismo origen (no hay problemas CORS)`, 'color: green');
  } else {
    console.log(`  • Origenes diferentes (posible problema CORS)`);
    try {
      const corsResponse = await fetch(`${apiBase}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
      };
      
      if (corsHeaders['Access-Control-Allow-Origin']) {
        console.log(`  • %c✅ CORS configurado correctamente`, 'color: green');
        console.log(`  • Headers CORS:`, corsHeaders);
      } else {
        console.log(`  • %c⚠️ No se detectaron headers CORS`, 'color: orange');
      }
    } catch (error) {
      console.log(`  • %c❌ Error verificando CORS: ${error instanceof Error ? error.message : String(error)}`, 'color: red');
    }
  }

  console.log('');
  console.log('%c📋 DIAGNÓSTICO COMPLETADO', 'font-size: 14px; font-weight: bold; color: blue');
  console.log('='.repeat(50));
}

// Para ejecutar el diagnóstico, copia todo este código en la consola y luego ejecuta:
// diagnosticarAPI()
export default diagnosticarAPI;