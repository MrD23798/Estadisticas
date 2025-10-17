import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

// 🧠 Hook para estadísticas de comparación usando React Query
export const useComparisonStatistics = () => {
  // Query para obtener dependencias disponibles (compartido)
  const {
    data: dependencias = [],
    isLoading: loadingDependencias,
    error: errorDependencias,
  } = useQuery({
    queryKey: ['dependencias'],
    queryFn: () => apiClient.getDependenciasDisponibles(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query para obtener períodos disponibles (compartido)
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

  // Función para comparar dependencias
  const useComparacion = (
    dependencias: string[],
    periodo: string,
    metricas: string[]
  ) => {
    return useQuery({
      queryKey: ['comparacion', dependencias, periodo, metricas],
      queryFn: () => apiClient.compararDependencias({ dependencias, periodo, metricas }),
      enabled: dependencias.length > 0 && !!periodo && metricas.length > 0,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Función para obtener top dependencias
  const useTopDependencias = (
    periodo: string,
    metrica: string,
    limite = 10,
    orden: 'asc' | 'desc' = 'desc'
  ) => {
    return useQuery({
      queryKey: ['top-dependencias', periodo, metrica, limite, orden],
      queryFn: () => apiClient.getTopDependencias(periodo, metrica, { limite, orden }),
      enabled: !!periodo && !!metrica,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
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
    useComparacion,
    useTopDependencias,
  };
};