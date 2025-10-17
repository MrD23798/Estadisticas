import mysql from 'mysql2/promise';
import { MasterSheetRow, DependencyData, ProcessedStatistics } from './masterSheetsService';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface StatisticsSummary {
  plantilla: string;
  numero: number;
  anio: number;
  mes: number;
  totalRecords: number;
  lastUpdated: Date;
}

class MasterDatabaseService {
  private connection: mysql.Connection | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'estadisticas_db',
    };
  }

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection(this.config);
      console.log('Master Database connection established successfully');
      await this.initializeTables();
    } catch (error) {
      console.error('Failed to connect to Master Database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('Master Database connection closed');
    }
  }

  private async initializeTables(): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Create master_sheets table to store the main sheet data
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS master_sheets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plantilla VARCHAR(255) NOT NULL,
          numero INT NOT NULL,
          anio INT NOT NULL,
          mes INT NOT NULL,
          id_original VARCHAR(255),
          id_confirmado VARCHAR(255) NOT NULL,
          estado VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_entry (plantilla, numero, anio, mes),
          INDEX idx_plantilla (plantilla),
          INDEX idx_periodo (anio, mes),
          INDEX idx_numero (numero)
        )
      `);

      // Create dependency_statistics table to store processed data from each sheet
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS dependency_statistics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sheet_id VARCHAR(255) NOT NULL,
          plantilla VARCHAR(255) NOT NULL,
          numero INT NOT NULL,
          anio INT NOT NULL,
          mes INT NOT NULL,
          field_name VARCHAR(255) NOT NULL,
          field_value TEXT,
          numeric_value DECIMAL(15, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_sheet_id (sheet_id),
          INDEX idx_plantilla_numero (plantilla, numero),
          INDEX idx_periodo (anio, mes),
          INDEX idx_field_name (field_name),
          UNIQUE KEY unique_field (sheet_id, field_name)
        )
      `);

      // Create aggregated_statistics table for quick access to summary data
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS aggregated_statistics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plantilla VARCHAR(255) NOT NULL,
          anio INT NOT NULL,
          mes INT NOT NULL,
          metric_name VARCHAR(255) NOT NULL,
          metric_value DECIMAL(15, 2) NOT NULL,
          count_dependencies INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_plantilla (plantilla),
          INDEX idx_periodo (anio, mes),
          INDEX idx_metric (metric_name),
          UNIQUE KEY unique_metric (plantilla, anio, mes, metric_name)
        )
      `);

      // Create sync_log table to track synchronization
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS master_sync_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sync_type ENUM('master_sheet', 'individual_sheets', 'aggregation') NOT NULL,
          plantilla VARCHAR(255),
          anio INT,
          mes INT,
          sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          records_processed INT NOT NULL,
          status ENUM('success', 'error', 'partial') NOT NULL,
          error_message TEXT,
          INDEX idx_sync_type (sync_type),
          INDEX idx_periodo (anio, mes),
          INDEX idx_sync_timestamp (sync_timestamp)
        )
      `);

      console.log('Master Database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize master database tables:', error);
      throw error;
    }
  }

  async insertMasterSheetData(data: MasterSheetRow[]): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Clear existing data
      await this.connection.execute('DELETE FROM master_sheets');

      // Insert new data
      for (const item of data) {
        await this.connection.execute(
          `INSERT INTO master_sheets (plantilla, numero, anio, mes, id_original, id_confirmado, estado) 
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           id_original = VALUES(id_original),
           id_confirmado = VALUES(id_confirmado),
           estado = VALUES(estado),
           updated_at = CURRENT_TIMESTAMP`,
          [
            item.plantilla,
            item.numero,
            item.anio,
            item.mes,
            item.idOriginal || null,
            item.idConfirmado,
            item.estado || null,
          ]
        );
      }

      // Log sync
      await this.logSync('master_sheet', null, null, null, data.length, 'success');
      console.log(`Inserted/Updated ${data.length} records in master_sheets table`);
    } catch (error) {
      await this.logSync('master_sheet', null, null, null, 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to insert master sheet data:', error);
      throw error;
    }
  }

  async insertDependencyStatistics(dependencyData: DependencyData): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Clear existing data for this specific dependency
      await this.connection.execute(
        'DELETE FROM dependency_statistics WHERE sheet_id = ?',
        [dependencyData.id]
      );

      let recordsInserted = 0;

      // Insert data from the individual sheet
      for (const row of dependencyData.data) {
        for (const [fieldName, fieldValue] of Object.entries(row)) {
          if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
            // Try to parse as number
            const numericValue = parseFloat(String(fieldValue));
            const isNumeric = !isNaN(numericValue);

            await this.connection.execute(
              `INSERT INTO dependency_statistics 
               (sheet_id, plantilla, numero, anio, mes, field_name, field_value, numeric_value) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                dependencyData.id,
                dependencyData.plantilla,
                dependencyData.numero,
                dependencyData.anio,
                dependencyData.mes,
                fieldName,
                String(fieldValue),
                isNumeric ? numericValue : null,
              ]
            );
            recordsInserted++;
          }
        }
      }

      console.log(`Inserted ${recordsInserted} statistics for ${dependencyData.plantilla} #${dependencyData.numero} (${dependencyData.anio}/${dependencyData.mes})`);
    } catch (error) {
      console.error(`Failed to insert dependency statistics for ${dependencyData.id}:`, error);
      throw error;
    }
  }

  async processAllStatistics(processedStats: ProcessedStatistics): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      let totalProcessed = 0;

      // Process each category
      for (const category of ['previsional', 'tributaria', 'sala'] as const) {
        const dependencies = processedStats[category];
        
        for (const dependency of dependencies) {
          await this.insertDependencyStatistics(dependency);
          totalProcessed++;
        }
      }

      // Generate aggregated statistics
      await this.generateAggregatedStatistics(processedStats);

      // Log sync
      await this.logSync('individual_sheets', null, null, null, totalProcessed, 'success');
      console.log(`Processed ${totalProcessed} dependencies successfully`);
    } catch (error) {
      await this.logSync('individual_sheets', null, null, null, 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to process all statistics:', error);
      throw error;
    }
  }

  private async generateAggregatedStatistics(processedStats: ProcessedStatistics): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Clear existing aggregated data
      await this.connection.execute('DELETE FROM aggregated_statistics');

      // Generate aggregations for each category and period
      for (const category of ['previsional', 'tributaria', 'sala'] as const) {
        const dependencies = processedStats[category];
        
        if (dependencies.length === 0) continue;

        // Group by year and month
        const periods = new Map<string, DependencyData[]>();
        dependencies.forEach(dep => {
          const key = `${dep.anio}-${dep.mes}`;
          if (!periods.has(key)) {
            periods.set(key, []);
          }
          periods.get(key)!.push(dep);
        });

        // Generate aggregations for each period
        for (const [periodKey, periodDeps] of periods) {
          const [anio, mes] = periodKey.split('-').map(Number);
          
          // Count total dependencies
          await this.connection.execute(
            `INSERT INTO aggregated_statistics (plantilla, anio, mes, metric_name, metric_value, count_dependencies)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [category, anio, mes, 'total_dependencies', periodDeps.length, periodDeps.length]
          );

          // Calculate average records per dependency
          const totalRecords = periodDeps.reduce((sum, dep) => sum + dep.data.length, 0);
          const avgRecords = totalRecords / periodDeps.length;
          
          await this.connection.execute(
            `INSERT INTO aggregated_statistics (plantilla, anio, mes, metric_name, metric_value, count_dependencies)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [category, anio, mes, 'avg_records_per_dependency', avgRecords, periodDeps.length]
          );

          // Total records
          await this.connection.execute(
            `INSERT INTO aggregated_statistics (plantilla, anio, mes, metric_name, metric_value, count_dependencies)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [category, anio, mes, 'total_records', totalRecords, periodDeps.length]
          );
        }
      }

      // Log aggregation sync
      await this.logSync('aggregation', null, null, null, 1, 'success');
      console.log('Aggregated statistics generated successfully');
    } catch (error) {
      await this.logSync('aggregation', null, null, null, 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to generate aggregated statistics:', error);
      throw error;
    }
  }

  async getStatisticsSummary(year?: number, month?: number): Promise<StatisticsSummary[]> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      let query = `
        SELECT 
          ms.plantilla,
          ms.numero,
          ms.anio,
          ms.mes,
          COUNT(ds.id) as totalRecords,
          MAX(ds.updated_at) as lastUpdated
        FROM master_sheets ms
        LEFT JOIN dependency_statistics ds ON ms.id_confirmado = ds.sheet_id
      `;
      
      const params: any[] = [];
      
      if (year && month) {
        query += ' WHERE ms.anio = ? AND ms.mes = ?';
        params.push(year, month);
      } else if (year) {
        query += ' WHERE ms.anio = ?';
        params.push(year);
      }
      
      query += ' GROUP BY ms.plantilla, ms.numero, ms.anio, ms.mes ORDER BY ms.plantilla, ms.numero, ms.anio DESC, ms.mes DESC';

      const [rows] = await this.connection.execute(query, params);
      
      return (rows as any[]).map(row => ({
        plantilla: row.plantilla,
        numero: row.numero,
        anio: row.anio,
        mes: row.mes,
        totalRecords: row.totalRecords || 0,
        lastUpdated: row.lastUpdated || new Date(),
      }));
    } catch (error) {
      console.error('Failed to get statistics summary:', error);
      throw error;
    }
  }

  async getAggregatedData(plantilla?: string, year?: number, month?: number): Promise<any[]> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      let query = 'SELECT * FROM aggregated_statistics';
      const params: any[] = [];
      const conditions: string[] = [];

      if (plantilla) {
        conditions.push('plantilla = ?');
        params.push(plantilla);
      }
      
      if (year) {
        conditions.push('anio = ?');
        params.push(year);
      }
      
      if (month) {
        conditions.push('mes = ?');
        params.push(month);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY plantilla, anio DESC, mes DESC, metric_name';

      const [rows] = await this.connection.execute(query, params);
      return rows as any[];
    } catch (error) {
      console.error('Failed to get aggregated data:', error);
      throw error;
    }
  }

  private async logSync(
    syncType: 'master_sheet' | 'individual_sheets' | 'aggregation',
    plantilla: string | null,
    anio: number | null,
    mes: number | null,
    recordsProcessed: number,
    status: 'success' | 'error' | 'partial',
    errorMessage?: string
  ): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.execute(
        'INSERT INTO master_sync_log (sync_type, plantilla, anio, mes, records_processed, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [syncType, plantilla, anio, mes, recordsProcessed, status, errorMessage || null]
      );
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }

  async getLastSyncTime(syncType: string, plantilla?: string): Promise<Date | null> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      let query = 'SELECT sync_timestamp FROM master_sync_log WHERE sync_type = ? AND status = "success"';
      const params: any[] = [syncType];
      
      if (plantilla) {
        query += ' AND plantilla = ?';
        params.push(plantilla);
      }
      
      query += ' ORDER BY sync_timestamp DESC LIMIT 1';

      const [rows] = await this.connection.execute(query, params);
      const result = rows as any[];
      return result.length > 0 ? new Date(result[0].sync_timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        await this.connect();
      }
      
      await this.connection!.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}

// Export singleton instance
export const masterDatabaseService = new MasterDatabaseService();
export default masterDatabaseService;