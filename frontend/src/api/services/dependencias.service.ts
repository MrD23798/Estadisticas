import httpClient from '../http';
import type {
  Dependencia,
  PaginatedResponse
} from '../../types/api';

/**
 * Servicio específico para operaciones de dependencias
 * Maneja CRUD de dependencias judiciales
 */
class DependenciasService {
  
  // ===== CRUD BÁSICO =====

  /**
   * Obtener todas las dependencias con filtros
   */
  async getDependencias(params?: {
    activa?: boolean;
    tipo?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Dependencia>> {
    return httpClient.get('/dependencias', { params });
  }

  /**
   * Obtener dependencia por ID
   */
  async getDependencia(id: number): Promise<Dependencia> {
    return httpClient.get(`/dependencias/${id}`);
  }

  /**
   * Crear nueva dependencia
   */
  async createDependencia(data: {
    nombre: string;
    codigo?: string;
    tipo?: string;
    jurisdiccion?: string;
    activa?: boolean;
    metadatos?: Record<string, unknown>;
  }): Promise<Dependencia> {
    return httpClient.post('/dependencias', data);
  }

  /**
   * Actualizar dependencia existente
   */
  async updateDependencia(id: number, data: Partial<Dependencia>): Promise<Dependencia> {
    return httpClient.put(`/dependencias/${id}`, data);
  }

  /**
   * Eliminar dependencia (soft delete)
   */
  async deleteDependencia(id: number): Promise<{ success: boolean; message: string }> {
    return httpClient.delete(`/dependencias/${id}`);
  }

  /**
   * Activar/Desactivar dependencia
   */
  async toggleDependencia(id: number, activa: boolean): Promise<Dependencia> {
    return httpClient.patch(`/dependencias/${id}/toggle`, { activa });
  }

  // ===== CONSULTAS ESPECIALIZADAS =====

  /**
   * Buscar dependencias por nombre
   */
  async buscarPorNombre(termino: string, limite: number = 10): Promise<Dependencia[]> {
    return httpClient.get('/dependencias/search', {
      params: { q: termino, limit: limite }
    });
  }

  /**
   * Obtener dependencias por tipo
   */
  async getDependenciasPorTipo(tipo: string): Promise<Dependencia[]> {
    return httpClient.get(`/dependencias/tipo/${tipo}`);
  }

  /**
   * Obtener tipos de dependencias disponibles
   */
  async getTiposDependencias(): Promise<Array<{ tipo: string; count: number }>> {
    return httpClient.get('/dependencias/tipos');
  }

  /**
   * Obtener estadísticas de dependencias
   */
  async getEstadisticasDependencias(): Promise<{
    total: number;
    activas: number;
    inactivas: number;
    porTipo: Array<{ tipo: string; count: number }>;
  }> {
    return httpClient.get('/dependencias/stats');
  }

  // ===== VALIDACIONES =====

  /**
   * Validar si un nombre de dependencia ya existe
   */
  async validarNombre(nombre: string, excludeId?: number): Promise<{
    available: boolean;
    suggestion?: string;
  }> {
    return httpClient.post('/dependencias/validate-name', { nombre, excludeId });
  }

  /**
   * Normalizar nombre de dependencia
   */
  async normalizarNombre(nombre: string): Promise<{
    normalized: string;
    tipo: string;
  }> {
    return httpClient.post('/dependencias/normalize', { nombre });
  }

  // ===== IMPORTACIÓN/EXPORTACIÓN =====

  /**
   * Importar dependencias desde CSV
   */
  async importarCSV(file: File): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ line: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return httpClient.post('/dependencias/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Exportar dependencias a CSV
   */
  async exportarCSV(filtros?: {
    activa?: boolean;
    tipo?: string;
  }): Promise<Blob> {
    const response = await httpClient.getClient().get('/dependencias/export', {
      params: filtros,
      responseType: 'blob'
    });
    return response.data;
  }
}

// ===== INSTANCIA SINGLETON =====
export const dependenciasService = new DependenciasService();
export { DependenciasService };
export default dependenciasService;