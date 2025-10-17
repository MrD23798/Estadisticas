import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';

// 🧠 Hook para estadísticas de evolución temporal usando React Query
export const useEvolutionStatistics = () => {
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

  // Función para obtener evolución temporal
  const useEvolucion = (
    dependencias: string[] | undefined,
    metrica: string,
    periodoInicio: string,
    periodoFin: string,
    agruparPor?: string
  ) => {
    return useQuery({
      queryKey: ['evolucion', dependencias, metrica, periodoInicio, periodoFin, agruparPor],
      queryFn: () => apiClient.getEvolucion({
        dependencias,
        metrica,
        periodoInicio,
        periodoFin,
        agruparPor
      }),
      enabled: !!metrica && !!periodoInicio && !!periodoFin,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Función para obtener timeline data
  const useTimelineData = (
    dependencias: string[] | undefined,
    metrica: string,
    periodoInicio: string,
    periodoFin: string,
    agruparPor?: string
  ) => {
    return useQuery({
      queryKey: ['timeline', dependencias, metrica, periodoInicio, periodoFin, agruparPor],
      queryFn: () => apiClient.getTimelineData({
        dependencias,
        metrica,
        periodoInicio,
        periodoFin,
        agruparPor
      }),
      enabled: !!metrica && !!periodoInicio && !!periodoFin,
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
    useEvolucion,
    useTimelineData,
  };
};