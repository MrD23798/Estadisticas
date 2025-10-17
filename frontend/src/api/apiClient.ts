import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 📡 Cliente HTTP único para comunicarse con el backend
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout: 60000, // Aumentado a 60 segundos para peticiones que toman más tiempo
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de request para agregar headers comunes
    this.client.interceptors.request.use(
      (config) => {
        // Agregar timestamp para evitar cache
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        // Logging en desarrollo
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de response para manejo de errores
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Logging en desarrollo
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log(`✅ ${response.status} ${response.config.url}`, response.data);
        }
        return response;
      },
      (error) => {
        console.error('❌ Response error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          data: error.response?.data,
        });

        // Personalizar mensajes de error
        if (error.response?.status === 404) {
          error.message = 'Recurso no encontrado';
        } else if (error.response?.status === 500) {
          error.message = 'Error interno del servidor';
        } else if (error.code === 'ECONNABORTED') {
          error.message = 'Tiempo de espera agotado';
        } else if (!error.response) {
          error.message = 'Error de conexión con el servidor';
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos HTTP genéricos
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error en petición GET a ${url}:`, error);
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en petición POST a ${url}:`, error);
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error en petición PUT a ${url}:`, error);
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error en petición DELETE a ${url}:`, error);
      throw error;
    }
  }

  // Métodos específicos para la API de estadísticas
  
  // 📊 Estadísticas por dependencia
  async getEstadisticasByDependencia(dependencia: string, params?: {
    periodo?: string;
    incluirHistorial?: boolean;
  }) {
    return this.get(`/api/estadisticas/dependencia/${encodeURIComponent(dependencia)}`, { params });
  }

  // 📈 Comparación entre dependencias
  async compararDependencias(data: {
    dependencias: string[];
    periodo: string;
    metricas: string[];
    buscarEnGoogleSheets?: boolean;
  }) {
    return this.post('/api/estadisticas/comparar', data);
  }

  // 📉 Evolución temporal
  async getEvolucion(data: {
    dependencias?: string[];
    metrica: string;
    periodoInicio: string;
    periodoFin: string;
    agruparPor?: string;
    buscarEnGoogleSheets?: boolean;
    objetoJuicio?: string;  // Añadido filtro por objeto de juicio
  }) {
    return this.post('/api/estadisticas/evolucion', data);
  }

  // 🏆 Top dependencias
  async getTopDependencias(periodo: string, metrica: string, params?: {
    limite?: number;
    orden?: 'asc' | 'desc';
  }) {
    return this.get(`/api/estadisticas/top/${periodo}/${metrica}`, { params });
  }

  // 📋 Categorías por dependencia
  async getCategorias(dependencia: string, periodo: string, params?: {
    topCategorias?: number;
    buscarEnGoogleSheets?: boolean;
  }) {
    return this.get(`/api/estadisticas/categorias/${encodeURIComponent(dependencia)}/${periodo}`, { params });
  }

  // 📊 Dashboard resumen
  async getDashboard(periodo: string, params?: {
    compararConAnterior?: boolean;
  }) {
    return this.get(`/api/estadisticas/dashboard/${periodo}`, { params });
  }

  // 🔄 Sincronización
  async sincronizar(data?: {
    sheetIds?: string[];
    forzar?: boolean;
    eliminarExistentes?: boolean;
  }) {
    return this.post('/api/estadisticas/sync', data || {});
  }
  
  // 🔄 Sincronización incremental - Sincronizar una sola hoja
  async sincronizarHojaIndividual(data: {
    sheetId: string;
    periodo: string;
    dependencia: string;
  }) {
    return this.post('/api/sync/sheet', data);
  }
  
  // 🔄 Sincronización incremental - Verificar estado de una hoja
  async verificarEstadoHoja(sheetId: string) {
    return this.get(`/api/sync/sheet/${sheetId}/status`);
  }

  // 📅 Períodos disponibles
  async getPeriodosDisponibles() {
    return this.get('/api/estadisticas/periodos');
  }

  // 🏢 Dependencias disponibles
  async getDependenciasDisponibles() {
    return this.get('/api/estadisticas/dependencias');
  }
  
  // 📑 Objetos de juicio disponibles
  async getObjetosJuicioDisponibles() {
    return this.get('/api/estadisticas/objetos-juicio');
  }

  // 🔍 Búsqueda
  async buscar(data: {
    termino: string;
    campos?: string[];
    limite?: number;
    offset?: number;
  }) {
    return this.post('/api/estadisticas/buscar', data);
  }

  // 📈 Timeline data
  async getTimelineData(data: {
    dependencias?: string[];
    metrica: string;
    periodoInicio: string;
    periodoFin: string;
    agruparPor?: string;
  }) {
    return this.post('/api/estadisticas/timeline', data);
  }
}

/**
 * Verifica la disponibilidad de la API y devuelve un estado
 * @returns Un objeto con el estado de disponibilidad y un mensaje opcional
 */
/**
 * Verifica la disponibilidad de la API y devuelve información detallada
 * @returns Un objeto con el estado de disponibilidad y detalles del servidor
 */
export async function checkAPIAvailability(): Promise<{
  available: boolean;
  message?: string;
  version?: string;
  environment?: string;
  database?: {
    connected: boolean;
    info?: any;
  };
  features?: {
    googleSheets: boolean;
    sync: boolean;
    cache: boolean;
  };
}> {
  try {
    const client = new ApiClient();
    const response = await client.get<{
      status: string;
      version: string;
      environment: string;
      database: { connected: boolean; info: any };
      features: { googleSheets: boolean; sync: boolean; cache: boolean };
    }>('/health', { 
      timeout: 5000 // Timeout más corto para health check
    });
    
    if (response?.status === 'ok') {
      return {
        available: true,
        message: `API v${response.version} (${response.environment})`,
        version: response.version,
        environment: response.environment,
        database: response.database,
        features: response.features
      };
    } else {
      return {
        available: false,
        message: 'API responde pero reporta estado inestable',
        version: response.version,
        environment: response.environment
      };
    }
  } catch (error) {
    console.error('Error al verificar disponibilidad de la API:', error);
    let message = 'Error de conexión';
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        message = 'Tiempo de espera agotado';
      } else if (error.response) {
        message = `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        message = 'No se recibió respuesta del servidor';
      }
    }
    
    return {
      available: false,
      message
    };
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();
export default apiClient;