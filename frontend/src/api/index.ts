/**
 * Archivo de índice para la API
 * Centraliza todas las exportaciones de servicios y tipos
 */

// ===== SERVICIOS =====
export { default as httpClient } from './http';
export { 
  statisticsService, 
  adminService,
  StatisticsService,
  AdminService 
} from './services/statistics.service';
export {
  dependenciasService,
  DependenciasService
} from './services/dependencias.service';

// ===== TIPOS =====
export type * from '../types/api';

// ===== LEGACY SUPPORT =====
// Mantener compatibilidad con el código existente
export { statisticsService as apiClient } from './services/statistics.service';

// ===== CONFIGURACIÓN =====
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;