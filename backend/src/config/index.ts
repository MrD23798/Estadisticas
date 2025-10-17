import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'estadisticas_db',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  },

  // Google Sheets Configuration
  googleSheets: {
    apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
    privateKey: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
    enabled: !!(process.env.GOOGLE_SHEETS_API_KEY || (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)),
  },

  // Application Configuration
  app: {
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    apiVersion: process.env.API_VERSION || '1.0.0',
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  },

  // Sync Configuration
  sync: {
    enabled: process.env.SYNC_ENABLED !== 'false',
    cronSchedule: process.env.SYNC_CRON_SCHEDULE || '0 */6 * * *', // Cada 6 horas
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100'),
    rateLimitMs: parseInt(process.env.SYNC_RATE_LIMIT_MS || '200'),
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hora
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '1000'),
    enabled: process.env.CACHE_ENABLED !== 'false',
  },

  // tRPC Configuration
  trpc: {
    endpoint: process.env.TRPC_ENDPOINT || '/trpc',
    playground: process.env.NODE_ENV === 'development',
  },
} as const;

// Validar configuraciones críticas
export function validateConfig() {
  const errors: string[] = [];

  // Validar base de datos
  if (!config.database.host) errors.push('DB_HOST is required');
  if (!config.database.database) errors.push('DB_NAME is required');
  if (!config.database.username) errors.push('DB_USER is required');

  // Validar Google Sheets si está habilitado
  if (config.sync.enabled && config.googleSheets.enabled) {
    // Validar que tengamos al menos API Key o Service Account
    const hasApiKey = !!config.googleSheets.apiKey;
    const hasServiceAccount = !!(config.googleSheets.clientEmail && config.googleSheets.privateKey);
    
    if (!hasApiKey && !hasServiceAccount) {
      errors.push('GOOGLE_SHEETS_API_KEY or (GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY) are required when sync is enabled');
    }
    
    if (!config.googleSheets.spreadsheetId) {
      errors.push('GOOGLE_SHEETS_SPREADSHEET_ID is required when sync is enabled');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

// Información de configuración para debugging
export function getConfigInfo() {
  return {
    environment: config.app.environment,
    database: {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      ssl: !!config.database.ssl,
    },
    server: {
      port: config.server.port,
      host: config.server.host,
    },
    features: {
      googleSheets: config.googleSheets.enabled,
      sync: config.sync.enabled,
      cache: config.cache.enabled,
      trpcPlayground: config.trpc.playground,
    },
    sync: config.sync.enabled ? {
      schedule: config.sync.cronSchedule,
      batchSize: config.sync.batchSize,
    } : null,
  };
}