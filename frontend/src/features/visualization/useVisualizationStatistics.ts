import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

// 🧠 Hook para estadísticas de visualización usando React Query
export const useVisualizationStatistics = () => {
  // Query para obtener dependencias disponibles
  const {
    data: dependencias = [],
    isLoading: loadingDependencias,
    error: errorDependencias,
  } = useQuery({
    queryKey: ['dependencias'],
    queryFn: () => apiClient.getDependenciasDisponibles(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Query para obtener períodos disponibles
  const {
    data: periodos = [],
    isLoading: loadingPeriodos,
    error: errorPeriodos,
  } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiClient.getPeriodosDisponibles(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Función para obtener estadísticas por dependencia
  const useEstadisticasByDependencia = (
    dependencia: string,
    options?: {
      periodo?: string;
      incluirHistorial?: boolean;
    }
  ) => {
    return useQuery({
      queryKey: ['estadisticas', 'dependencia', dependencia, options],
      queryFn: () => apiClient.getEstadisticasByDependencia(dependencia, options),
      enabled: !!dependencia,
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Función para obtener categorías
  const useCategorias = (dependencia: string, periodo: string, topCategorias?: number) => {
    return useQuery({
      queryKey: ['categorias', dependencia, periodo, topCategorias],
      queryFn: () => apiClient.getCategorias(dependencia, periodo, { topCategorias }),
      enabled: !!dependencia && !!periodo,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Función para obtener dashboard
  const useDashboard = (periodo: string, compararConAnterior = true) => {
    return useQuery({
      queryKey: ['dashboard', periodo, compararConAnterior],
      queryFn: () => apiClient.getDashboard(periodo, { compararConAnterior }),
      enabled: !!periodo,
      staleTime: 1 * 60 * 1000, // 1 minuto
      gcTime: 3 * 60 * 1000, // 3 minutos
    });
  };

  return {
    // Datos base
    dependencias,
    periodos,
    loadingDependencias,
    loadingPeriodos,
    errorDependencias,
    errorPeriodos,
    
    // Hooks para consultas específicas
    useEstadisticasByDependencia,
    useCategorias,
    useDashboard,
  };
};