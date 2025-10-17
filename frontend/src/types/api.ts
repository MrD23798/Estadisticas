// ===== TIPOS BASE =====

export interface Periodo {
  periodo: string; // "202402"
  label: string;   // "Febrero 2024"
  year: number;    // 2024
  month: number;   // 2
}

export interface Dependencia {
  id: number;
  nombre: string;
  codigo?: string;
  tipo?: string;
  activa: boolean;
  metadatos?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TipoCaso {
  id: number;
  name: string;
  codigo?: string;
  descripcion?: string;
  categoria?: string;
  activo: boolean;
  orden: number;
}

// ===== ESTADÍSTICAS =====

export interface Estadistica {
  id: number;
  sheetId: string;
  dependenciaId: number;
  periodo: string;
  fechaEstadistica?: string;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  categoriasDetalle?: Record<string, {
    asignados: number;
    reingresados: number;
  }>;
  metadatos?: {
    nombreJuez?: string;
    nombreSecretario?: string;
    observaciones?: string;
    fuenteDatos?: 'google_sheets' | 'csv' | 'manual';
    version?: string;
  };
  dependencia: Dependencia;
  createdAt: string;
  updatedAt: string;
}

export interface EstadisticaTipoCaso {
  id: number;
  estadisticaId: number;
  tipoCasoId: number;
  recibidosAsignados: number;
  reingresados: number;
  existentes: number;
  total: number;
  resueltos: number;
  pendientes: number;
  porcentajeResolucion: number;
  estadistica: Estadistica;
  tipoCaso: TipoCaso;
}

// ===== PARÁMETROS DE CONSULTA =====

export interface EstadisticasFiltros {
  dependenciaId?: number;
  periodoInicio?: string;
  periodoFin?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface EvolutionParams {
  dependencias?: string[];
  metrica: string;
  periodoInicio: string;
  periodoFin: string;
  agruparPor?: 'mes' | 'trimestre' | 'año';
}

export interface ComparacionParams {
  dependencias: string[];
  periodo: string;
  metricas: string[];
}

export interface TopParams {
  limite?: number;
  orden?: 'asc' | 'desc';
}

export interface BusquedaParams {
  termino: string;
  campos?: string[];
  limite?: number;
  offset?: number;
}

export interface TimelineParams {
  dependencias?: string[];
  metrica: string;
  periodoInicio: string;
  periodoFin: string;
  agruparPor?: 'mes' | 'trimestre' | 'año';
}

// ===== RESPUESTAS DE API =====

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DashboardData {
  resumen: {
    totalExpedientes: number;
    expedientesExistentes: number;
    expedientesRecibidos: number;
    expedientesReingresados: number;
    variacionMesAnterior: {
      porcentaje: number;
      absoluto: number;
      tendencia: 'subida' | 'bajada' | 'estable';
    };
  };
  topDependencias: {
    porExistentes: Array<{ nombre: string; valor: number; }>;
    porRecibidos: Array<{ nombre: string; valor: number; }>;
    porTotal: Array<{ nombre: string; valor: number; }>;
  };
  distribucionTiposCaso: Array<{
    tipoCaso: string;
    cantidad: number;
    porcentaje: number;
  }>;
  evolucionMensual: Array<{
    periodo: string;
    expedientesExistentes: number;
    expedientesRecibidos: number;
    total: number;
  }>;
  estadisticasPorDependencia: {
    total: number;
    conDatos: number;
    sinDatos: number;
  };
}

export interface EvolutionData {
  periodos: string[];
  series: Array<{
    nombre: string;
    data: number[];
    color?: string;
  }>;
  metrica: string;
  unidad?: string;
}

export interface ComparacionData {
  dependencias: string[];
  metricas: Array<{
    nombre: string;
    valores: number[];
    unidad?: string;
  }>;
  periodo: string;
}

export interface TopDependenciasData {
  ranking: Array<{
    posicion: number;
    dependencia: string;
    valor: number;
    variacion?: {
      porcentaje: number;
      tendencia: 'subida' | 'bajada' | 'estable';
    };
  }>;
  metrica: string;
  periodo: string;
  total: number;
}

export interface CategoriesData {
  dependencia: string;
  periodo: string;
  categorias: Array<{
    nombre: string;
    asignados: number;
    reingresados: number;
    total: number;
    porcentaje: number;
  }>;
  totales: {
    asignados: number;
    reingresados: number;
    total: number;
  };
}

// ===== SINCRONIZACIÓN =====

export interface SyncParams {
  secret: string;
  dependencyName?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    total: number;
    success: number;
    errors: number;
    results: Array<{
      sheetId: string;
      dependencyName: string;
      success: boolean;
      error?: string;
    }>;
  };
  timestamp: string;
  requestedBy: string;
  type: 'single_dependency' | 'full_sync';
}

export interface SyncStatus {
  success: boolean;
  status: string;
  configuration: {
    googleSheetsConfigured: boolean;
    syncSecretConfigured: boolean;
    databaseConnected: boolean;
  };
  environment: string;
  timestamp: string;
}

export interface SheetsInfo {
  success: boolean;
  message: string;
  reportCount: number;
  reports: Array<{
    sheetId: string;
    dependencyName: string;
    lastUpdate?: string;
  }>;
  timestamp: string;
}

// ===== RESPUESTAS DE ERROR =====

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  details: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// ===== TIPOS UTILITARIOS =====

export type Metrica = 
  | 'expedientesExistentes'
  | 'expedientesRecibidos'
  | 'expedientesReingresados'
  | 'total'
  | 'porcentajeResolucion';

export type AgrupacionTemporal = 'mes' | 'trimestre' | 'año';

export type OrdenDirection = 'ASC' | 'DESC';

export type Tendencia = 'subida' | 'bajada' | 'estable';

// ===== EXPORT DE TIPOS COMUNES =====

export type {
  // Re-exportar tipos de Axios que puedan ser útiles
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';