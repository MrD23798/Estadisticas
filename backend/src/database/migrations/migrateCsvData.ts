import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { AppDataSource } from '../../config/database'
import { Estadistica } from '../entities/Estadistica'
import { Dependencia } from '../entities/Dependencia'

// Interfaces para migración CSV
interface CsvRecord {
  Dependencia: string
  Codigo: string
  CodObjeto: string
  Naturaleza: string
  Objeto: string
  Período: string
  Cantidad: string
  'Objeto-Desc - Tipo_Expte': string
}

interface CsvMigrationResult {
  filename: string
  periodo: number
  recordsProcessed: number
  recordsInserted: number
  recordsSkipped: number
  errors: string[]
  duration: number
  success: boolean
}

export class CsvMigrationService {
  private dataDir: string

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data')
  }

  /**
   * Migrar todos los archivos CSV a las nuevas entidades TypeORM
   */
  async migrateAllCsvFiles(): Promise<CsvMigrationResult[]> {
    try {
      console.log('🚀 Iniciando migración CSV a nuevas entidades...')
      
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
      }
      
      const csvFiles = this.getCsvFiles()
      console.log(`📁 Encontrados ${csvFiles.length} archivos CSV`)

      const results: CsvMigrationResult[] = []

      for (const filename of csvFiles) {
        console.log(`\n📊 Procesando: ${filename}`)
        const result = await this.migrateCsvFile(filename)
        results.push(result)

        // Pausa entre archivos para no saturar
        await this.delay(100)
      }

      const summary = this.calculateSummary(results)
      console.log('\n🎉 Migración completada!')
      console.log('📊 Resumen:')
      console.log(`   Archivos totales: ${summary.totalFiles}`)
      console.log(`   Exitosos: ${summary.successful}`)
      console.log(`   Fallidos: ${summary.failed}`)
      console.log(`   Registros procesados: ${summary.totalProcessed}`)
      console.log(`   Registros insertados: ${summary.totalInserted}`)
      console.log(`   Duración total: ${summary.totalDuration}ms`)

      return results

    } catch (error) {
      console.error('❌ Error en migración:', error)
      throw error
    }
  }

  /**
   * Migrar un archivo CSV específico
   */
  async migrateCsvFile(filename: string): Promise<CsvMigrationResult> {
    const startTime = Date.now()
    
    const result: CsvMigrationResult = {
      filename,
      periodo: this.extractPeriodoFromFilename(filename),
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0,
      success: false
    }

    try {
      const filePath = path.join(this.dataDir, filename)
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`)
      }

      const records = await this.readCsvFile(filePath)
      result.recordsProcessed = records.length

      const dependenciaRepo = AppDataSource.getRepository(Dependencia)
      const estadisticaRepo = AppDataSource.getRepository(Estadistica)

      for (const record of records) {
        try {
          // Buscar o crear dependencia
          let dependencia = await dependenciaRepo.findOne({
            where: { nombre: record.Dependencia.trim() }
          })

          if (!dependencia) {
            dependencia = dependenciaRepo.create({
              nombre: record.Dependencia.trim(),
              tipo: Dependencia.extraerTipo(record.Dependencia),
              activa: true,
            })
            await dependenciaRepo.save(dependencia)
          }

          // Verificar si ya existe esta estadística
          const existeEstadistica = await estadisticaRepo.findOne({
            where: {
              dependenciaId: dependencia.id,
              periodo: result.periodo.toString(),
            }
          })

          if (existeEstadistica) {
            result.recordsSkipped++
            continue
          }

          // Crear nueva estadística usando el formato legacy convertido
          const estadistica = estadisticaRepo.create({
            sheetId: `csv_${filename}_${Date.now()}`,
            dependenciaId: dependencia.id,
            periodo: result.periodo.toString(),
            expedientesExistentes: parseInt(record.Cantidad) || 0,
            expedientesRecibidos: 0, // No disponible en CSV legacy
            expedientesReingresados: 0, // No disponible en CSV legacy
            categoriasDetalle: {
              [record.Objeto || 'general']: {
                asignados: parseInt(record.Cantidad) || 0,
                reingresados: 0
              }
            },
            metadatos: {
              fuenteDatos: 'csv' as const,
              version: 'legacy_migration'
            }
          })

          await estadisticaRepo.save(estadistica)
          result.recordsInserted++

        } catch (recordError) {
          const errorMsg = `Error procesando registro: ${(recordError as Error).message}`
          result.errors.push(errorMsg)
          console.warn(`⚠️ ${errorMsg}`)
        }
      }

      result.duration = Date.now() - startTime
      result.success = result.errors.length === 0
      
      console.log(`✅ ${filename}: ${result.recordsInserted}/${result.recordsProcessed} registros insertados`)

    } catch (error) {
      result.errors.push((error as Error).message)
      result.duration = Date.now() - startTime
      result.success = false
      
      console.error(`❌ Error en ${filename}:`, error)
    }

    return result
  }

  /**
   * Leer archivo CSV y convertir a array de objetos
   */
  private readCsvFile(filePath: string): Promise<CsvRecord[]> {
    return new Promise((resolve, reject) => {
      const records: CsvRecord[] = []
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: CsvRecord) => {
          records.push(data)
        })
        .on('end', () => {
          resolve(records)
        })
        .on('error', (error) => {
          reject(error)
        })
    })
  }

  /**
   * Obtener lista de archivos CSV en el directorio de datos
   */
  private getCsvFiles(): string[] {
    if (!fs.existsSync(this.dataDir)) {
      console.warn(`⚠️ Directorio de datos no encontrado: ${this.dataDir}`)
      return []
    }

    return fs.readdirSync(this.dataDir)
      .filter(file => file.endsWith('.csv'))
      .sort()
  }

  /**
   * Extraer período del nombre del archivo
   */
  private extractPeriodoFromFilename(filename: string): number {
    const match = filename.match(/(\d{6})/)
    return match && match[1] ? parseInt(match[1], 10) : 0
  }

  /**
   * Calcular resumen de resultados
   */
  private calculateSummary(results: CsvMigrationResult[]) {
    return {
      totalFiles: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      totalInserted: results.reduce((sum, r) => sum + r.recordsInserted, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Script ejecutable
if (require.main === module) {
  const migrationService = new CsvMigrationService()
  
  migrationService.migrateAllCsvFiles()
    .then((results) => {
      console.log('\n🎊 Migración CSV completada exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Error en migración CSV:', error)
      process.exit(1)
    })
}