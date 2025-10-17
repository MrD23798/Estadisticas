import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Cliente HTTP genérico y reutilizable
 * Se encarga únicamente de la configuración de Axios y los interceptores
 */
class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Interceptor de request para agregar headers comunes
    this.client.interceptors.request.use(
      (config) => {
        // Agregar timestamp para evitar cache en GET requests
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
        } else if (error.response?.status === 401) {
          error.message = 'No autorizado';
        } else if (error.response?.status === 403) {
          error.message = 'Acceso denegado';
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
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Método para obtener la instancia de Axios directamente si es necesario
  getClient(): AxiosInstance {
    return this.client;
  }

  // Método para agregar interceptores adicionales desde servicios específicos
  addRequestInterceptor(
    onFulfilled?: (config: any) => any,
    onRejected?: (error: any) => any
  ) {
    return this.client.interceptors.request.use(onFulfilled, onRejected);
  }

  addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => any,
    onRejected?: (error: any) => any
  ) {
    return this.client.interceptors.response.use(onFulfilled, onRejected);
  }
}

// Instancia singleton del cliente HTTP
export const httpClient = new HttpClient();
export default httpClient;