/**
 * Script de Importación Masiva: CSV → JSON → Base de Datos
 * 
 * Este script procesa archivos CSV de estadísticas judiciales en dos fases:
 * 1. Transformación: CSV → JSON estructurado
 * 2. Carga Masiva: JSON → MySQL (usando TypeORM)
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { AppDataSource } from '../config/database';
import { GoogleSheetsService } from '../services/google.sheets.service';
import { Dependencia } from '../database/entities/Dependencia';
import { Estadistica } from '../database/entities/Estadistica';
import { TipoCaso } from '../database/entities/TipoCaso';
import { EstadisticaTipoCaso } from '../database/entities/EstadisticaTipoCaso';

// ==================== INTERFACES ====================

interface CSVRow {
  [key: string]: string;
}

interface CaseType {
  name: string;
  recibidosAsignados: number;
  reingresados: number;
  resueltos?: number;
  pendientes?: number;
}

interface EstadisticaJSON {
  context: {
    dependencia: string;
    dependenciaAbreviada?: string;
    periodo: string;
    anio: number;
    mes: number;
    fechaEstadistica: string;
  };
  totals: {
    expedientesExistentes: number;
    expedientesRecibidos: number;
    expedientesReingresados: number;
    expedientesResueltos?: number;
    expedientesPendientes?: number;
  };
  caseTypes: CaseType[];
  metadata: {
    csvFileName: string;
    juez?: string;
    secretario?: string;
    importedAt: string;
  };
}

// ==================== CONFIGURACIÓN ====================

const CSV_FOLDER = path.join(__dirname, '../../data/csv');
const JSON_DUMP_FOLDER = path.join(__dirname, '../../data/json_dump');

// Crear carpeta json_dump si no existe
if (!fs.existsSync(JSON_DUMP_FOLDER)) {
  fs.mkdirSync(JSON_DUMP_FOLDER, { recursive: true });
  console.log(`📁 Carpeta creada: ${JSON_DUMP_FOLDER}`);
}

// ==================== FASE 1: TRANSFORMACIÓN CSV → JSON ====================

/**
 * Extrae información de contexto del nombre del archivo CSV
 * Formato esperado: ME_J02_SEC_1_202402_CONF - Inicios.csv
 */
function parseFileNameContext(fileName: string): {
  dependencia: string;
  periodo: string | null;
  anio: number | null;
  mes: number | null;
} {
  // Remover extensión
  const baseName = fileName.replace('.csv', '');
  
  // Extraer periodo (YYYYMM)
  const periodoMatch = baseName.match(/(\d{6})/);
  const periodo = periodoMatch ? periodoMatch[1] : null;
  
  let anio: number | null = null;
  let mes: number | null = null;
  
  if (periodo && periodo.length === 6) {
    anio = parseInt(periodo.substring(0, 4));
    mes = parseInt(periodo.substring(4, 6));
  }
  
  // Extraer nombre de dependencia del archivo
  // Ejemplo: ME_J02_SEC_1 → J2-S1
  const parts = baseName.split('_');
  let dependencia = baseName;
  
  if (parts.length >= 3) {
    const juzgado = parts[1]?.replace(/^J0?/, 'J'); // J02 → J2
    const secretaria = parts[2]?.replace(/^SEC_/, 'S'); // SEC_1 → S1
    if (juzgado && secretaria) {
      dependencia = `${juzgado}-${secretaria}`;
    }
  }
  
  return { 
    dependencia, 
    periodo: periodo || null, 
    anio: anio || null, 
    mes: mes || null 
  };
}

/**
 * Extrae el nombre completo de la dependencia desde las primeras filas del CSV.
 * Busca líneas que contengan palabras clave como 'JUZGADO', 'CÁMARA' o 'SECRETARÍA'
 * y arma un nombre legible combinando las líneas encontradas.
 */
function extractFullDependencia(rows: string[][]): string | null {
  // Tomar las primeras 8 filas que suelen contener el encabezado con nombre completo
  const headerLines = rows.slice(0, 8).map(r => (r[0] || '').trim()).filter(Boolean);

  if (headerLines.length === 0) return null;

  // Buscar líneas con palabras clave
  const camara = headerLines.find(l => /CAMARA|CÁMARA/i.test(l));
  const juzgado = headerLines.find(l => /JUZGADO|TRIBUNAL|CORTE/i.test(l));
  const secretaria = headerLines.find(l => /SECRETAR[IÍ]A|SECRETARIA/i.test(l));

  // Priorizar JUZGADO + SECRETARÍA, si existe
  let parts: string[] = [];
  if (juzgado) parts.push(juzgado);
  if (secretaria) parts.push(secretaria);
  // Incluir cámara si es relevante y no está duplicada
  if (!juzgado && camara) parts.push(camara);

  if (parts.length === 0) {
    // Como fallback, usar la primera línea significativa
    return headerLines[0] || null;
  }

  // Normalizar espacios y devolver concatenado
  return parts.map(p => p.replace(/\s+/g, ' ').trim()).join(' - ');
}

/**
 * Lee un archivo CSV y retorna todas las filas como arrays
 */
async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv({
        separator: ',',
        headers: false, // Sin headers, leer como arrays
        mapValues: ({ value }) => value ? value.trim() : ''
      }))
      .on('data', (row) => {
        // Convertir objeto a array
        const rowArray = Object.values(row) as string[];
        rows.push(rowArray);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Busca una fecha en formato DD/MM/AAAA en las filas del CSV
 */
function extractFechaEstadistica(rows: string[][]): string | null {
  for (const row of rows) {
    for (const value of row) {
      if (!value) continue;
      // Buscar patrón DD/MM/AAAA
      const fechaMatch = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (fechaMatch) {
        const [, dia, mes, anio] = fechaMatch;
        return `${anio}-${mes}-${dia}`;
      }
    }
  }
  return null;
}

/**
 * Extrae valores numéricos de una sección específica
 * Para el formato del CSV, los totales están en la columna 6 (índice 6)
 */
function extractNumericValue(rows: string[][], searchText: string): number {
  for (const row of rows) {
    const firstColumn = row[0] || '';
    
    if (firstColumn.includes(searchText)) {
      // En este formato, el valor numérico está en la columna 6
      const valueColumn = row[6] || '';
      const num = parseFloat(valueColumn.replace(/[^\d.-]/g, ''));
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return 0;
}

/**
 * Extrae tipos de caso de la sección "II. EXPEDIENTES RECIBIDOS"
 * En este formato:
 * - Columna 0: Nombre del tipo de caso
 * - Columna 5: Asignados
 * - Columna 6: Reingresados
 */
function extractCaseTypes(rows: string[][]): CaseType[] {
  const caseTypes: CaseType[] = [];
  let inRecibidosSection = false;
  
  for (const row of rows) {
    const firstColumn = row[0] || '';
    
    // Detectar inicio de sección
    if (firstColumn.includes('II. EXPEDIENTES RECIBIDOS')) {
      inRecibidosSection = true;
      continue;
    }
    
    // Detectar fin de sección (cuando empieza sección III)
    if (firstColumn.includes('III.')) {
      inRecibidosSection = false;
      break;
    }
    
    if (inRecibidosSection && firstColumn.length > 3) {
      // Saltar filas de encabezado
      if (firstColumn.toLowerCase().includes('asignados') || 
          firstColumn.toLowerCase().includes('reingresados')) {
        continue;
      }
      
      // Extraer valores numéricos de las columnas 5 y 6
      const asignadosStr = row[5] || '0';
      const reingresadosStr = row[6] || '0';
      
      const asignados = parseInt(asignadosStr.replace(/[^\d]/g, '')) || 0;
      const reingresados = parseInt(reingresadosStr.replace(/[^\d]/g, '')) || 0;
      
      if (asignados > 0 || reingresados > 0) {
        caseTypes.push({
          name: firstColumn,
          recibidosAsignados: asignados,
          reingresados: reingresados
        });
      }
    }
  }
  
  return caseTypes;
}

/**
 * Transforma un archivo CSV en un objeto JSON estructurado
 */
async function transformCSVToJSON(csvFilePath: string): Promise<EstadisticaJSON | null> {
  try {
    const fileName = path.basename(csvFilePath);
    console.log(`  📄 Procesando: ${fileName}`);
    
    // Leer CSV
    const rows = await readCSV(csvFilePath);
    
    if (rows.length === 0) {
      console.warn(`  ⚠️  Archivo vacío: ${fileName}`);
      return null;
    }
    
  // Extraer contexto del nombre del archivo (abreviatura)
  const fileContext = parseFileNameContext(fileName);

  // Intentar extraer el nombre completo de la dependencia desde el CSV (encabezado)
  const fullDependencia = extractFullDependencia(rows) || fileContext.dependencia;
    
    if (!fileContext.periodo || !fileContext.anio || !fileContext.mes) {
      console.warn(`  ⚠️  No se pudo extraer periodo de: ${fileName}`);
      return null;
    }
    
    // Extraer fecha estadística
    const fechaEstadistica = extractFechaEstadistica(rows) || 
      `${fileContext.anio}-${String(fileContext.mes).padStart(2, '0')}-01`;
    
    // Extraer totales
    const expedientesExistentes = extractNumericValue(rows, 'I. EXPEDIENTES EXISTENTES');
    const expedientesRecibidos = extractNumericValue(rows, 'II. EXPEDIENTES RECIBIDOS');
    
    // Extraer tipos de caso
    const caseTypes = extractCaseTypes(rows);
    
    // Calcular reingresados totales
    const expedientesReingresados = caseTypes.reduce((sum, ct) => sum + ct.reingresados, 0);
    
    // Construir objeto JSON
    const estadisticaJSON: EstadisticaJSON = {
      context: {
        dependencia: fullDependencia,
        dependenciaAbreviada: fileContext.dependencia,
        periodo: fileContext.periodo,
        anio: fileContext.anio,
        mes: fileContext.mes,
        fechaEstadistica: fechaEstadistica
      },
      totals: {
        expedientesExistentes,
        expedientesRecibidos,
        expedientesReingresados
      },
      caseTypes,
      metadata: {
        csvFileName: fileName,
        importedAt: new Date().toISOString()
      }
    };
    
    console.log(`  ✅ Transformado: ${caseTypes.length} tipos de caso, Recibidos: ${expedientesRecibidos}`);
    
    return estadisticaJSON;
    
  } catch (error) {
    console.error(`  ❌ Error procesando ${path.basename(csvFilePath)}:`, error);
    return null;
  }
}

/**
 * Procesa todos los archivos CSV en la carpeta y los convierte a JSON
 */
async function phase1_TransformAllCSVs(): Promise<string[]> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 FASE 1: TRANSFORMACIÓN CSV → JSON');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Leer todos los archivos CSV
  const files = fs.readdirSync(CSV_FOLDER).filter(f => f.endsWith('.csv'));
  
  console.log(`📁 Encontrados ${files.length} archivos CSV en: ${CSV_FOLDER}\n`);
  
  if (files.length === 0) {
    console.warn('⚠️  No se encontraron archivos CSV para procesar');
    return [];
  }
  
  const jsonFiles: string[] = [];
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (!file) continue; // Safety check
    
    const csvPath = path.join(CSV_FOLDER, file);
    
    console.log(`[${i + 1}/${files.length}]`);
    
    try {
      const estadisticaJSON = await transformCSVToJSON(csvPath);
      
      if (estadisticaJSON) {
        // Guardar JSON
        const jsonFileName = file.replace('.csv', '.json');
        const jsonPath = path.join(JSON_DUMP_FOLDER, jsonFileName);
        
        fs.writeFileSync(jsonPath, JSON.stringify(estadisticaJSON, null, 2), 'utf-8');
        
        jsonFiles.push(jsonPath);
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`  ❌ Error fatal procesando ${file}:`, error);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FASE 1:');
  console.log(`  ✅ Exitosos: ${successful}`);
  console.log(`  ❌ Fallidos: ${failed}`);
  console.log(`  📄 Archivos JSON generados: ${jsonFiles.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  return jsonFiles;
}

// ==================== FASE 2: CARGA MASIVA JSON → BASE DE DATOS ====================

/**
 * Mapea el objeto JSON a EstadisticaData para guardar en BD
 */
function mapJSONToEstadisticaData(json: EstadisticaJSON): {
  sheetId: string;
  dependencia: string;
  dependenciaCodigo?: string | undefined;
  periodo: string;
  fechaEstadistica: Date;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  categoriasDetalle: Record<string, { asignados: number; reingresados: number }>;
  metadatos: any;
} {
  // Construir categoriasDetalle
  const categoriasDetalle: Record<string, { asignados: number; reingresados: number }> = {};
  
  for (const caseType of json.caseTypes) {
    categoriasDetalle[caseType.name] = {
      asignados: caseType.recibidosAsignados,
      reingresados: caseType.reingresados
    };
  }
  
  return {
    sheetId: `CSV_${json.metadata.csvFileName}`,
    dependencia: json.context.dependencia,
    dependenciaCodigo: json.context.dependenciaAbreviada || undefined,
    periodo: json.context.periodo,
    fechaEstadistica: new Date(json.context.fechaEstadistica),
    expedientesExistentes: json.totals.expedientesExistentes,
    expedientesRecibidos: json.totals.expedientesRecibidos,
    expedientesReingresados: json.totals.expedientesReingresados,
    categoriasDetalle,
    metadatos: {
      fuenteDatos: 'CSV_IMPORT',
      archivoOriginal: json.metadata.csvFileName,
      importadoEn: json.metadata.importedAt
    }
  };
}

/**
 * Carga todos los archivos JSON en la base de datos
 */
async function phase2_LoadJSONsToDatabase(jsonFiles: string[]): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('💾 FASE 2: CARGA MASIVA JSON → BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (jsonFiles.length === 0) {
    console.warn('⚠️  No hay archivos JSON para cargar');
    return;
  }
  
  console.log(`📦 Iniciando carga de ${jsonFiles.length} archivos JSON...\n`);
  
  // Inicializar conexión a BD
  console.log('🔌 Conectando a la base de datos...');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  console.log('✅ Conexión establecida\n');
  
  // Obtener repositorios
  const dependenciaRepo = AppDataSource.getRepository(Dependencia);
  const estadisticaRepo = AppDataSource.getRepository(Estadistica);
  const tipoCasoRepo = AppDataSource.getRepository(TipoCaso);
  const estadisticaTipoCasoRepo = AppDataSource.getRepository(EstadisticaTipoCaso);
  
  let successful = 0;
  let updated = 0;
  let failed = 0;
  let tiposCasoCreados = 0;
  let relacionesCreadas = 0;
  
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonFile = jsonFiles[i];
    
    if (!jsonFile) continue; // Safety check
    
    const fileName = path.basename(jsonFile);
    
    console.log(`[${i + 1}/${jsonFiles.length}] 📄 ${fileName}`);
    
    try {
      // Leer y parsear JSON
      const jsonContent = fs.readFileSync(jsonFile, 'utf-8');
      const estadisticaJSON: EstadisticaJSON = JSON.parse(jsonContent);
      
      // Mapear a formato de BD
      const estadisticaData = mapJSONToEstadisticaData(estadisticaJSON);
      
      console.log(`  📊 Dependencia: ${estadisticaData.dependencia}`);
      console.log(`  📅 Período: ${estadisticaData.periodo}`);
      console.log(`  📈 Recibidos: ${estadisticaData.expedientesRecibidos}`);
      console.log(`  🏷️  Categorías: ${Object.keys(estadisticaData.categoriasDetalle).length}`);
      
      // === GUARDAR DEPENDENCIA ===
      // Buscar por nombre completo o por código/abreviatura existente
      const búsquedaWhere: any[] = [
        { nombre: estadisticaData.dependencia }
      ];

      if (estadisticaData.dependenciaCodigo) {
        búsquedaWhere.push({ codigo: estadisticaData.dependenciaCodigo });
        búsquedaWhere.push({ nombre: estadisticaData.dependenciaCodigo });
      }

      let dependencia = await dependenciaRepo.findOne({ where: búsquedaWhere });

      if (!dependencia) {
        // Crear nueva dependencia con nombre completo y código
        const nuevaDependencia = new Dependencia();
        nuevaDependencia.nombre = estadisticaData.dependencia;
        if (estadisticaData.dependenciaCodigo) {
          nuevaDependencia.codigo = estadisticaData.dependenciaCodigo;
        }
        nuevaDependencia.tipo = Dependencia.extraerTipo(estadisticaData.dependencia);
        nuevaDependencia.activa = true;
        dependencia = await dependenciaRepo.save(nuevaDependencia);
        console.log(`  ➕ Dependencia creada: ${dependencia.nombre}`);
      } else {
        // Si la dependencia existente tiene como nombre la abreviatura, actualizar para usar el nombre completo
        const codigo = estadisticaData.dependenciaCodigo;
        if (codigo && dependencia.nombre === codigo && estadisticaData.dependencia && estadisticaData.dependencia !== codigo) {
          dependencia.nombre = estadisticaData.dependencia;
          if (!dependencia.codigo) {
            dependencia.codigo = codigo;
          }
          await dependenciaRepo.save(dependencia);
          console.log(`  ✏️  Dependencia actualizada (nombre completo): ${dependencia.nombre}`);
        }
      }

      // === GUARDAR O ACTUALIZAR ESTADÍSTICA ===
      let estadistica = await estadisticaRepo.findOne({
        where: {
          dependenciaId: dependencia.id,
          periodo: estadisticaData.periodo,
        }
      });

      const isNew = !estadistica;

      if (estadistica) {
        // Actualizar existente
        Object.assign(estadistica, {
          sheetId: estadisticaData.sheetId,
          fechaEstadistica: estadisticaData.fechaEstadistica,
          expedientesExistentes: estadisticaData.expedientesExistentes,
          expedientesRecibidos: estadisticaData.expedientesRecibidos,
          expedientesReingresados: estadisticaData.expedientesReingresados,
          categoriasDetalle: estadisticaData.categoriasDetalle,
          metadatos: estadisticaData.metadatos,
        });
      } else {
        // Crear nuevo
        estadistica = new Estadistica();
        estadistica.sheetId = estadisticaData.sheetId;
        estadistica.dependenciaId = dependencia.id;
        estadistica.periodo = estadisticaData.periodo;
        estadistica.fechaEstadistica = estadisticaData.fechaEstadistica;
        estadistica.expedientesExistentes = estadisticaData.expedientesExistentes;
        estadistica.expedientesRecibidos = estadisticaData.expedientesRecibidos;
        estadistica.expedientesReingresados = estadisticaData.expedientesReingresados;
        estadistica.categoriasDetalle = estadisticaData.categoriasDetalle;
        estadistica.metadatos = estadisticaData.metadatos;
      }

      await estadisticaRepo.save(estadistica);

      // === GUARDAR TIPOS DE CASO Y RELACIONES ===
      if (estadisticaJSON.caseTypes && estadisticaJSON.caseTypes.length > 0) {
        console.log(`  🔗 Procesando ${estadisticaJSON.caseTypes.length} tipos de caso...`);
        
        for (const caseType of estadisticaJSON.caseTypes) {
          // Buscar o crear TipoCaso
          let tipoCaso = await tipoCasoRepo.findOne({
            where: { name: caseType.name }
          });

          if (!tipoCaso) {
            tipoCaso = tipoCasoRepo.create({
              name: caseType.name,
              activo: true,
              orden: 0
            });
            await tipoCasoRepo.save(tipoCaso);
            tiposCasoCreados++;
          }

          // Buscar o crear EstadisticaTipoCaso (relación)
          let relacionExistente = await estadisticaTipoCasoRepo.findOne({
            where: {
              estadisticaId: estadistica.id,
              tipoCasoId: tipoCaso.id
            }
          });

          if (relacionExistente) {
            // Actualizar relación existente
            relacionExistente.recibidosAsignados = caseType.recibidosAsignados;
            relacionExistente.reingresados = caseType.reingresados;
            relacionExistente.total = caseType.recibidosAsignados + caseType.reingresados;
            await estadisticaTipoCasoRepo.save(relacionExistente);
          } else {
            // Crear nueva relación
            const nuevaRelacion = estadisticaTipoCasoRepo.create({
              estadisticaId: estadistica.id,
              tipoCasoId: tipoCaso.id,
              recibidosAsignados: caseType.recibidosAsignados,
              reingresados: caseType.reingresados,
              total: caseType.recibidosAsignados + caseType.reingresados,
              existentes: 0,
              resueltos: 0,
              pendientes: 0,
              porcentajeResolucion: 0
            });
            await estadisticaTipoCasoRepo.save(nuevaRelacion);
            relacionesCreadas++;
          }
        }
        
        console.log(`  ✅ Tipos de caso guardados correctamente`);
      }
      
      if (isNew) {
        console.log(`  ✅ Estadística creada exitosamente`);
        successful++;
      } else {
        console.log(`  🔄 Estadística actualizada`);
        updated++;
      }
      
    } catch (error: any) {
      console.error(`  ❌ Error guardando ${fileName}:`, error.message);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('💾 RESUMEN FASE 2:');
  console.log(`  ✅ Nuevas estadísticas: ${successful}`);
  console.log(`  🔄 Estadísticas actualizadas: ${updated}`);
  console.log(`  📋 Tipos de caso creados: ${tiposCasoCreados}`);
  console.log(`  🔗 Relaciones creadas: ${relacionesCreadas}`);
  console.log(`  ❌ Fallidos: ${failed}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// ==================== FUNCIÓN PRINCIPAL ====================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        IMPORTACIÓN MASIVA DE ESTADÍSTICAS                  ║');
  console.log('║        CSV → JSON → MySQL                                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const startTime = Date.now();
  
  try {
    // FASE 1: Transformar CSV a JSON
    const jsonFiles = await phase1_TransformAllCSVs();
    
    // FASE 2: Cargar JSON a Base de Datos
    await phase2_LoadJSONsToDatabase(jsonFiles);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║               ✅ PROCESO COMPLETADO                        ║');
    console.log(`║               ⏱️  Duración: ${duration}s${' '.repeat(Math.max(0, 31 - duration.length))}║`);
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  } finally {
    // Cerrar conexión a BD
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexión a base de datos cerrada\n');
    }
  }
}

// Ejecutar script
main();
