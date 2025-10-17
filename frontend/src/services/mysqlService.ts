import mysql from 'mysql2/promise';
import { SheetData } from './googleSheetsService';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

class MySQLService {
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
      console.log('MySQL connection established successfully');
      await this.initializeTables();
    } catch (error) {
      console.error('Failed to connect to MySQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('MySQL connection closed');
    }
  }

  private async initializeTables(): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Create chart_data table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS chart_data (
          id VARCHAR(255) PRIMARY KEY,
          object_type VARCHAR(255) NOT NULL,
          count INT NOT NULL,
          category VARCHAR(255),
          label VARCHAR(255),
          value DECIMAL(10, 2),
          x DECIMAL(10, 2),
          z DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_object_type (object_type),
          INDEX idx_category (category)
        )
      `);

      // Create comparison_data_a table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS comparison_data_a (
          id VARCHAR(255) PRIMARY KEY,
          object_type VARCHAR(255) NOT NULL,
          count INT NOT NULL,
          category VARCHAR(255),
          label VARCHAR(255),
          value DECIMAL(10, 2),
          x DECIMAL(10, 2),
          z DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_object_type (object_type),
          INDEX idx_category (category)
        )
      `);

      // Create comparison_data_b table
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS comparison_data_b (
          id VARCHAR(255) PRIMARY KEY,
          object_type VARCHAR(255) NOT NULL,
          count INT NOT NULL,
          category VARCHAR(255),
          label VARCHAR(255),
          value DECIMAL(10, 2),
          x DECIMAL(10, 2),
          z DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_object_type (object_type),
          INDEX idx_category (category)
        )
      `);

      // Create sync_log table to track synchronization
      await this.connection.execute(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_name VARCHAR(255) NOT NULL,
          sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          records_synced INT NOT NULL,
          status ENUM('success', 'error') NOT NULL,
          error_message TEXT,
          INDEX idx_table_name (table_name),
          INDEX idx_sync_timestamp (sync_timestamp)
        )
      `);

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  async insertChartData(data: SheetData[]): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Clear existing data
      await this.connection.execute('DELETE FROM chart_data');

      // Insert new data
      for (const item of data) {
        await this.connection.execute(
          `INSERT INTO chart_data (id, object_type, count, category, label, value, x, z) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.objectType,
            item.count,
            item.category || null,
            item.label || null,
            item.value || null,
            item.x || null,
            item.z || null,
          ]
        );
      }

      // Log sync
      await this.logSync('chart_data', data.length, 'success');
      console.log(`Inserted ${data.length} records into chart_data table`);
    } catch (error) {
      await this.logSync('chart_data', 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to insert chart data:', error);
      throw error;
    }
  }

  async insertComparisonData(dataA: SheetData[], dataB: SheetData[]): Promise<void> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      // Clear existing data
      await this.connection.execute('DELETE FROM comparison_data_a');
      await this.connection.execute('DELETE FROM comparison_data_b');

      // Insert data A
      for (const item of dataA) {
        await this.connection.execute(
          `INSERT INTO comparison_data_a (id, object_type, count, category, label, value, x, z) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.objectType,
            item.count,
            item.category || null,
            item.label || null,
            item.value || null,
            item.x || null,
            item.z || null,
          ]
        );
      }

      // Insert data B
      for (const item of dataB) {
        await this.connection.execute(
          `INSERT INTO comparison_data_b (id, object_type, count, category, label, value, x, z) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.objectType,
            item.count,
            item.category || null,
            item.label || null,
            item.value || null,
            item.x || null,
            item.z || null,
          ]
        );
      }

      // Log sync
      await this.logSync('comparison_data_a', dataA.length, 'success');
      await this.logSync('comparison_data_b', dataB.length, 'success');
      console.log(`Inserted ${dataA.length} records into comparison_data_a and ${dataB.length} records into comparison_data_b`);
    } catch (error) {
      await this.logSync('comparison_data_a', 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      await this.logSync('comparison_data_b', 0, 'error', error instanceof Error ? error.message : 'Unknown error');
      console.error('Failed to insert comparison data:', error);
      throw error;
    }
  }

  async getChartData(): Promise<SheetData[]> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      const [rows] = await this.connection.execute('SELECT * FROM chart_data ORDER BY object_type');
      return (rows as any[]).map(row => ({
        id: row.id,
        objectType: row.object_type,
        count: row.count,
        category: row.category,
        label: row.label,
        value: row.value,
        x: row.x,
        z: row.z,
      }));
    } catch (error) {
      console.error('Failed to get chart data:', error);
      throw error;
    }
  }

  async getComparisonData(): Promise<{ dataA: SheetData[]; dataB: SheetData[] }> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      const [rowsA] = await this.connection.execute('SELECT * FROM comparison_data_a ORDER BY object_type');
      const [rowsB] = await this.connection.execute('SELECT * FROM comparison_data_b ORDER BY object_type');

      const dataA = (rowsA as any[]).map(row => ({
        id: row.id,
        objectType: row.object_type,
        count: row.count,
        category: row.category,
        label: row.label,
        value: row.value,
        x: row.x,
        z: row.z,
      }));

      const dataB = (rowsB as any[]).map(row => ({
        id: row.id,
        objectType: row.object_type,
        count: row.count,
        category: row.category,
        label: row.label,
        value: row.value,
        x: row.x,
        z: row.z,
      }));

      return { dataA, dataB };
    } catch (error) {
      console.error('Failed to get comparison data:', error);
      throw error;
    }
  }

  private async logSync(tableName: string, recordsCount: number, status: 'success' | 'error', errorMessage?: string): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.execute(
        'INSERT INTO sync_log (table_name, records_synced, status, error_message) VALUES (?, ?, ?, ?)',
        [tableName, recordsCount, status, errorMessage || null]
      );
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }

  async getLastSyncTime(tableName: string): Promise<Date | null> {
    if (!this.connection) {
      throw new Error('No MySQL connection available');
    }

    try {
      const [rows] = await this.connection.execute(
        'SELECT sync_timestamp FROM sync_log WHERE table_name = ? AND status = "success" ORDER BY sync_timestamp DESC LIMIT 1',
        [tableName]
      );

      const result = rows as any[];
      return result.length > 0 ? new Date(result[0].sync_timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}

// Export singleton instance
export const mysqlService = new MySQLService();
export default mysqlService;