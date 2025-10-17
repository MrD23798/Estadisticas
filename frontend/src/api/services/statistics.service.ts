import httpClient from '../http';
import type {
  Estadistica,
  Dependencia,
  Periodo,
  DashboardData,
  EvolutionData,
  ComparacionData,
  TopDependenciasData,
  CategoriesData,
  SyncResult,
  SyncStatus,
  SheetsInfo,
  PaginatedResponse,
  EstadisticasFiltros,
  EvolutionParams,
  ComparacionParams,
  TopParams,
  BusquedaParams,
  TimelineParams,
  SyncParams
} from '../../types/api';

/**
 * Servicio específico para operaciones de estadísticas
 * Maneja toda la lógica de comunicación con el backend para estadísticas
 */
class StatisticsService {
  
  // ===== CONSULTAS PRINCIPALES =====

  /**
   * Obtener estadísticas con filtros y paginación
   */
  async getEstadisticas(filtros: EstadisticasFiltros = {}): Promise<PaginatedResponse<Estadistica>> {
    return httpClient.get('/estadisticas', { params: filtros });
  }

  /**
   * Obtener una estadística específica por ID
   */
  async getEstadistica(id: number): Promise<Estadistica> {
    return httpClient.get(`/estadisticas/${id}`);
  }

  /**
   * Crear nueva estadística
   */
  async createEstadistica(data: Partial<Estadistica>): Promise<Estadistica> {
    return httpClient.post('/estadisticas', data);
  }

  /**
   * Actualizar estadística existente
   */
  async updateEstadistica(id: number, data: Partial<Estadistica>): Promise<Estadistica> {
    return httpClient.put(`/estadisticas/${id}`, data);
  }

  /**
   * Eliminar estadística
   */
  async deleteEstadistica(id: number): Promise<{ success: boolean; message: string }> {
    return httpClient.delete(`/estadisticas/${id}`);
  }

  // ===== CONSULTAS POR DEPENDENCIA =====

  /**
   * Obtener estadísticas por dependencia específica
   */
  async getEstadisticasByDependencia(
    dependencia: string, 
    params?: {
      periodo?: string;
      incluirHistorial?: boolean;
    }
  ): Promise<Estadistica[]> {
    return httpClient.get(`/estadisticas/dependencia/${encodeURIComponent(dependencia)}`, { params });
  }

  /**
   * Comparar múltiples dependencias
   */
  async compararDependencias(data: ComparacionParams): Promise<ComparacionData> {
    return httpClient.post('/estadisticas/comparar', data);
  }

  /**
   * Obtener top dependencias por métrica
   */
  async getTopDependencias(
    periodo: string, 
    metrica: string, 
    params?: TopParams
  ): Promise<TopDependenciasData> {
    return httpClient.get(`/estadisticas/top/${periodo}/${metrica}`, { params });
  }

  /**
   * Obtener categorías por dependencia y período
   */
  async getCategorias(
    dependencia: string, 
    periodo: string, 
    params?: { topCategorias?: number }
  ): Promise<CategoriesData> {
    return httpClient.get(
      `/estadisticas/categorias/${encodeURIComponent(dependencia)}/${periodo}`, 
      { params }
    );
  }

  // ===== ANÁLISIS TEMPORAL =====

  /**
   * Obtener evolución temporal de métricas
   */
  async getEvolucion(data: EvolutionParams): Promise<EvolutionData> {
    return httpClient.post('/estadisticas/evolucion', data);
  }

  /**
   * Obtener datos para timeline interactivo
   */
  async getTimelineData(data: TimelineParams): Promise<EvolutionData> {
    return httpClient.post('/estadisticas/timeline', data);
  }

  // ===== DASHBOARD Y RESÚMENES =====

  /**
   * Obtener datos del dashboard principal
   */
  async getDashboard(
    periodo: string, 
    params?: { compararConAnterior?: boolean }
  ): Promise<DashboardData> {
    return httpClient.get(`/estadisticas/dashboard/${periodo}`, { params });
  }

  // ===== CATÁLOGOS Y METADATOS =====

  /**
   * Obtener períodos disponibles
   */
  async getPeriodosDisponibles(): Promise<Periodo[]> {
    return httpClient.get('/estadisticas/periodos');
  }

  /**
   * Obtener dependencias disponibles
   */
  async getDependenciasDisponibles(): Promise<Dependencia[]> {
    return httpClient.get('/estadisticas/dependencias');
  }

  // ===== BÚSQUEDA =====

  /**
   * Buscar estadísticas por término
   */
  async buscar(data: BusquedaParams): Promise<PaginatedResponse<Estadistica>> {
    return httpClient.post('/estadisticas/buscar', data);
  }

  // ===== EXPORTACIONES =====

  /**
   * Exportar estadísticas a CSV
   */
  async exportarCSV(filtros: EstadisticasFiltros = {}): Promise<Blob> {
    const response = await httpClient.getClient().get('/estadisticas/export/csv', {
      params: filtros,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Exportar estadísticas a Excel
   */
  async exportarExcel(filtros: EstadisticasFiltros = {}): Promise<Blob> {
    const response = await httpClient.getClient().get('/estadisticas/export/excel', {
      params: filtros,
      responseType: 'blob'
    });
    return response.data;
  }

  // ===== VALIDACIONES =====

  /**
   * Validar datos antes de crear/actualizar
   */
  async validarDatos(data: Partial<Estadistica>): Promise<{ valid: boolean; errors?: string[] }> {
    return httpClient.post('/estadisticas/validate', data);
  }
}

/**
 * Servicio de administración y sincronización
 * Maneja operaciones administrativas y sync con Google Sheets
 */
class AdminService {
  
  // ===== SINCRONIZACIÓN =====

  /**
   * Ejecutar sincronización completa o específica
   */
  async sincronizar(params: SyncParams): Promise<SyncResult> {
    return httpClient.post('/admin/sync', params);
  }

  /**
   * Obtener estado del servicio de sincronización
   */
  async getSyncStatus(secret: string): Promise<SyncStatus> {
    return httpClient.post('/admin/sync/status', { secret });
  }

  /**
   * Obtener información de hojas de Google Sheets
   */
  async getSheetsInfo(secret: string): Promise<SheetsInfo> {
    return httpClient.post('/admin/sync/sheets-info', { secret });
  }
}

// ===== INSTANCIAS SINGLETON =====

export const statisticsService = new StatisticsService();
export const adminService = new AdminService();

// Exportar servicios individuales
export { StatisticsService, AdminService };

// Export por defecto del servicio principal
export default statisticsService;