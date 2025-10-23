import { DataSource } from 'typeorm';
import { config } from './index';
import { Dependencia } from '../database/entities/Dependencia';
import { Estadistica } from '../database/entities/Estadistica';
import { TipoCaso } from '../database/entities/TipoCaso';
import { EstadisticaTipoCaso } from '../database/entities/EstadisticaTipoCaso';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: true, // Temporalmente deshabilitado para evitar conflictos
  logging: config.database.logging,
  ssl: config.database.ssl,
  entities: [Dependencia, Estadistica, TipoCaso, EstadisticaTipoCaso],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts'],
  extra: {
    connectionLimit: 10,
    // Quitar estas opciones incompatibles con mysql2
    // acquireTimeout: 60000,
    // timeout: 60000,
    // Configuración específica para MariaDB
    authPlugin: 'mysql_native_password',
    charset: 'utf8mb4',
    // Configuración de conexión
    connectTimeout: 60000,
    acquireTimeout: 60000,
  },
});

// Función para inicializar la conexión
export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
}

// Función para cerrar la conexión
export async function closeDatabase() {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📴 Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}

// Función para verificar el estado de la base de datos
export async function checkDatabaseHealth() {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }
    
    // Hacer una consulta simple para verificar conectividad
    await AppDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Función para obtener información de la conexión
export function getDatabaseInfo() {
  return {
    isInitialized: AppDataSource.isInitialized,
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    synchronize: config.database.synchronize,
    logging: config.database.logging,
  };
}