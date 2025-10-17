// Exportar tipos principales para el frontend
export type { AppRouter } from './routes'

// Exportar tipos de datos principales
export type {
  StatisticRecord,
  StatisticFilters,
  EvolutionData,
  StatisticsSummary,
  PaginatedResponse,
  DataSourceInfo,
  Dependencia,
  ObjetoExpediente
} from './dto/legacy-types.dto'

// Re-exportar para compatibilidad
export type { StatisticRecord as Statistics } from './dto/legacy-types.dto'