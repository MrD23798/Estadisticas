import { z } from 'zod';

// 🛡️ Esquemas de validación para la API de estadísticas

// Schema para consulta de estadísticas individuales
export const ConsultaIndividualSchema = z.object({
  dependencia: z.string().min(1, 'La dependencia es requerida'),
  periodo: z.string().regex(/^\d{6}$/, 'El período debe tener formato YYYYMM').optional(),
  incluirHistorial: z.boolean().default(false),
});

export type ConsultaIndividualDTO = z.infer<typeof ConsultaIndividualSchema>;

// Schema para consulta comparativa
export const ConsultaComparativaSchema = z.object({
  dependencias: z.array(z.string().min(1)).min(1, 'Se requiere al menos una dependencia'),
  periodo: z.string().regex(/^\d{6}$/, 'El período debe tener formato YYYYMM'),
  metricas: z.array(z.enum(['existentes', 'recibidos', 'reingresados', 'categorias'])).min(1),
  buscarEnGoogleSheets: z.boolean().default(true),
});

export type ConsultaComparativaDTO = z.infer<typeof ConsultaComparativaSchema>;

// Schema para evolución temporal
export const EvolucionTemporalSchema = z.object({
  dependencias: z.array(z.string().min(1)).optional(),
  metrica: z.enum(['existentes', 'recibidos', 'reingresados']),
  periodoInicio: z.string().regex(/^\d{6}$/, 'El período de inicio debe tener formato YYYYMM'),
  periodoFin: z.string().regex(/^\d{6}$/, 'El período de fin debe tener formato YYYYMM'),
  agruparPor: z.enum(['mes', 'trimestre', 'año']).default('mes'),
  buscarEnGoogleSheets: z.boolean().default(true),
  objetoJuicio: z.string().optional(), // Filtro por objeto de juicio específico
});

export type EvolucionTemporalDTO = z.infer<typeof EvolucionTemporalSchema>;

// Schema para top dependencias
export const TopDependenciasSchema = z.object({
  periodo: z.string().regex(/^\d{6}$/, 'El período debe tener formato YYYYMM'),
  metrica: z.enum(['existentes', 'recibidos', 'reingresados']),
  limite: z.number().int().min(1).max(50).default(10),
  orden: z.enum(['asc', 'desc']).default('desc'),
});

export type TopDependenciasDTO = z.infer<typeof TopDependenciasSchema>;

// Schema para categorías
export const ConsultaCategoriasSchema = z.object({
  dependencia: z.string().min(1, 'La dependencia es requerida'),
  periodo: z.string().regex(/^\d{6}$/, 'El período debe tener formato YYYYMM'),
  topCategorias: z.number().int().min(1).max(30).default(10),
  buscarEnGoogleSheets: z.boolean().default(false),
});

export type ConsultaCategoriasDTO = z.infer<typeof ConsultaCategoriasSchema>;

// Schema para dashboard resumen
export const DashboardResumenSchema = z.object({
  periodo: z.string().regex(/^\d{6}$/, 'El período debe tener formato YYYYMM'),
  compararConAnterior: z.boolean().default(true),
});

export type DashboardResumenDTO = z.infer<typeof DashboardResumenSchema>;

// Schema para sincronización
export const SincronizacionSchema = z.object({
  sheetIds: z.array(z.string()).optional(),
  forzar: z.boolean().default(false),
  eliminarExistentes: z.boolean().default(false),
});

export type SincronizacionDTO = z.infer<typeof SincronizacionSchema>;

// Schema para búsqueda
export const BusquedaSchema = z.object({
  termino: z.string().min(1, 'El término de búsqueda es requerido'),
  campos: z.array(z.enum(['dependencia', 'periodo', 'categorias'])).default(['dependencia']),
  limite: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type BusquedaDTO = z.infer<typeof BusquedaSchema>;

// Schema para filtros avanzados
export const FiltrosAvanzadosSchema = z.object({
  dependencias: z.array(z.string()).optional(),
  periodos: z.array(z.string().regex(/^\d{6}$/)).optional(),
  rangoFechas: z.object({
    inicio: z.string().datetime().optional(),
    fin: z.string().datetime().optional(),
  }).optional(),
  rangoCantidades: z.object({
    existentesMin: z.number().int().min(0).optional(),
    existentesMax: z.number().int().min(0).optional(),
    recibidosMin: z.number().int().min(0).optional(),
    recibidosMax: z.number().int().min(0).optional(),
  }).optional(),
  ordenarPor: z.enum(['dependencia', 'periodo', 'existentes', 'recibidos']).default('periodo'),
  ordenDireccion: z.enum(['asc', 'desc']).default('desc'),
  limite: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
});

export type FiltrosAvanzadosDTO = z.infer<typeof FiltrosAvanzadosSchema>;

// 📊 Tipos de respuesta de la API
export interface EstadisticaResponse {
  id: number;
  sheetId: string;
  dependencia: string;
  periodo: string;
  fechaEstadistica?: string;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  categoriasDetalle?: Record<string, { asignados: number; reingresados: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface ComparacionResponse {
  dependencia: string;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  categoriasDetalle?: Record<string, { asignados: number; reingresados: number }>;
  fechaEstadistica?: string;
}

export interface EvolucionResponse {
  periodo: string;
  dependencia?: string;
  valor: number;
  numeroDependencias?: number;
}

export interface DashboardResponse {
  actual: {
    totalDependencias: number;
    totalExistentes: number;
    totalRecibidos: number;
    totalReingresados: number;
    promedioExistentes: number;
    maximoExistentes: number;
    minimoExistentes: number;
  };
  anterior?: {
    totalDependencias: number;
    totalExistentes: number;
    totalRecibidos: number;
    totalReingresados: number;
  };
  crecimiento?: {
    dependencias: number;
    existentes: number;
    recibidos: number;
    reingresados: number;
  };
}

export interface CategoriaResponse {
  categoria: string;
  asignados: number;
  reingresados: number;
  total: number;
}

// 🛠️ Funciones de validación helper
export function validarPeriodo(periodo: string): boolean {
  const match = periodo.match(/^(\d{4})(\d{2})$/);
  if (!match || !match[1] || !match[2]) return false;
  
  const ano = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  
  return ano >= 2005 && ano <= 2099 && mes >= 1 && mes <= 12;
}

export function validarRangoPeriodos(inicio: string, fin: string): boolean {
  return validarPeriodo(inicio) && validarPeriodo(fin) && inicio <= fin;
}

export function normalizarNombreDependencia(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ').toUpperCase();
}

// ===============================
// ESQUEMAS PARA ENDPOINTS FRONTEND
// ===============================

// Schema para evolución de dependencia específica
export const EvolucionDependenciaSchema = z.object({
  dependenciaId: z.number().int().positive('El ID de dependencia debe ser un número positivo'),
});

export type EvolucionDependenciaDTO = z.infer<typeof EvolucionDependenciaSchema>;

// Schema para comparativa de múltiples dependencias
export const ComparativaDependenciasSchema = z.object({
  dependenciaIds: z.array(z.number().int().positive()).min(1, 'Se requiere al menos un ID de dependencia'),
  anio: z.number().int().min(2005).max(2099, 'El año debe estar entre 2005 y 2099'),
  mes: z.number().int().min(1).max(12, 'El mes debe estar entre 1 y 12'),
});

export type ComparativaDependenciasDTO = z.infer<typeof ComparativaDependenciasSchema>;

// Schema para reporte individual completo
export const ReporteIndividualSchema = z.object({
  dependenciaId: z.number().int().positive('El ID de dependencia debe ser un número positivo'),
  anio: z.number().int().min(2005).max(2099, 'El año debe estar entre 2005 y 2099'),
  mes: z.number().int().min(1).max(12, 'El mes debe estar entre 1 y 12'),
});

export type ReporteIndividualDTO = z.infer<typeof ReporteIndividualSchema>;

// 📊 Tipos de respuesta para los nuevos endpoints

export interface EvolucionDependenciaResponse {
  periodo: string;
  valorMetrica: number;
}

export interface ComparativaDependenciasResponse {
  dependenciaNombre: string;
  valorMetrica: number;
}

export interface TipoCasoDetalle {
  nombre: string;
  asignados: number;
  reingresados: number;
  existentes: number;
  resueltos: number;
  pendientes: number;
}

export interface ReporteIndividualResponse {
  dependencia: string;
  periodo: string;
  fecha?: string;
  expedientesExistentes: number;
  expedientesRecibidos: number;
  expedientesReingresados: number;
  totalExpedientes: number;
  tiposDeCaso: TipoCasoDetalle[];
  resumen: {
    totalTiposDeCaso: number;
    totalAsignados: number;
    totalReingresados: number;
    totalResueltos: number;
    totalPendientes: number;
  };
  metadatos?: Record<string, any>;
  ultimaActualizacion?: string;
}