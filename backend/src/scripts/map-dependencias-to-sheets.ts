/**
 * Script para mapear dependencias a sus hojas de Google Sheets correspondientes
 * 
 * Este script:
 * 1. Lista todas las hojas disponibles en Google Sheets
 * 2. Por cada hoja, extrae las dependencias que contiene
 * 3. Actualiza la tabla dependencias con el nombre de la hoja (sheetName)
 * 
 * Uso: npm run ts-node src/scripts/map-dependencias-to-sheets.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Dependencia } from '../database/entities/Dependencia';
import { googleSheetsService } from '../services/google.sheets.service';

async function mapDependenciasToSheets() {
  console.log('🔄 Iniciando mapeo de dependencias a hojas de Google Sheets...\n');
  
  try {
    // Inicializar conexión a la base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conexión a base de datos inicializada\n');
    }
    
    // Verificar que Google Sheets esté disponible
    if (!googleSheetsService.isAvailable()) {
      throw new Error('Google Sheets service no está disponible');
    }
    console.log('✅ Google Sheets service disponible\n');
    
    // Listar todas las hojas disponibles
    console.log('📋 Listando hojas disponibles...');
    const availableSheets = await googleSheetsService.listAvailableSheets();
    console.log(`✅ Se encontraron ${availableSheets.length} hojas\n`);
    
    const dependenciaRepo = AppDataSource.getRepository(Dependencia);
    let totalMapeadas = 0;
    let totalYaMapeadas = 0;
    
    // Procesar cada hoja
    for (const sheet of availableSheets) {
      console.log(`\n🔍 Procesando hoja: ${sheet.name}`);
      
      try {
        // Extraer datos de la hoja
        const estadisticas = await googleSheetsService.extractSheetData(sheet.name);
        
        if (estadisticas.length === 0) {
          console.log(`  ⚠️ No se encontraron datos en esta hoja`);
          continue;
        }
        
        // Obtener todas las dependencias únicas de esta hoja
        const dependenciasEnHoja = [...new Set(estadisticas.map(e => e.dependencia))];
        console.log(`  📊 Encontradas ${dependenciasEnHoja.length} dependencias en esta hoja`);
        
        // Actualizar cada dependencia con el nombre de la hoja
        for (const nombreDependencia of dependenciasEnHoja) {
          // Buscar la dependencia en la BD (por nombre o código)
          const dependencia = await dependenciaRepo.findOne({
            where: [
              { nombre: nombreDependencia },
              { codigo: nombreDependencia }
            ]
          });
          
          if (!dependencia) {
            console.log(`  ⚠️ Dependencia "${nombreDependencia}" no encontrada en BD`);
            continue;
          }
          
          // Si ya tiene sheetName, no sobrescribir
          if (dependencia.sheetName) {
            console.log(`  ⏭️ "${dependencia.nombre || dependencia.codigo}" ya tiene sheetName: ${dependencia.sheetName}`);
            totalYaMapeadas++;
            continue;
          }
          
          // Actualizar con el nombre de la hoja
          dependencia.sheetName = sheet.name;
          await dependenciaRepo.save(dependencia);
          console.log(`  ✅ Mapeado: "${dependencia.nombre || dependencia.codigo}" → ${sheet.name}`);
          totalMapeadas++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error procesando hoja ${sheet.name}:`, error);
        continue;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL MAPEO:');
    console.log(`  • Total de hojas procesadas: ${availableSheets.length}`);
    console.log(`  • Dependencias mapeadas: ${totalMapeadas}`);
    console.log(`  • Dependencias ya mapeadas: ${totalYaMapeadas}`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ Mapeo completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante el mapeo:', error);
    throw error;
  } finally {
    // Cerrar conexión a la base de datos
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('\n✅ Conexión a base de datos cerrada');
    }
  }
}

// Ejecutar el script
mapDependenciasToSheets()
  .then(() => {
    console.log('\n🎉 Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
