import { useState, useEffect, useCallback } from 'react';
import { statisticsService, dependenciasService, adminService } from '../api';
import type {
  Estadistica,
  EstadisticasFiltros
} from '../types/api';

// ===== HOOK GENÉRICO PARA LLAMADAS A API =====

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiCall, ...dependencies]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

// ===== HOOKS ESPECÍFICOS PARA ESTADÍSTICAS =====

/**
 * Hook para obtener estadísticas con filtros
 */
export function useEstadisticas(filtros: EstadisticasFiltros = {}) {
  return useApiCall(
    () => statisticsService.getEstadisticas(filtros),
    [JSON.stringify(filtros)]
  );
}

/**
 * Hook para obtener una estadística específica
 */
export function useEstadistica(id: number | null) {
  return useApiCall(
    () => id ? statisticsService.getEstadistica(id) : Promise.resolve(null),
    [id]
  );
}

/**
 * Hook para obtener datos del dashboard
 */
export function useDashboard(periodo: string) {
  return useApiCall(
    () => statisticsService.getDashboard(periodo),
    [periodo]
  );
}

/**
 * Hook para obtener dependencias disponibles
 */
export function useDependencias() {
  return useApiCall(
    () => statisticsService.getDependenciasDisponibles(),
    []
  );
}

/**
 * Hook para obtener períodos disponibles
 */
export function usePeriodos() {
  return useApiCall(
    () => statisticsService.getPeriodosDisponibles(),
    []
  );
}

/**
 * Hook para evolución temporal
 */
export function useEvolucion(params: {
  dependencias?: string[];
  metrica: string;
  periodoInicio: string;
  periodoFin: string;
  agruparPor?: 'mes' | 'trimestre' | 'año';
}) {
  return useApiCall(
    () => statisticsService.getEvolucion(params),
    [JSON.stringify(params)]
  );
}

// ===== HOOKS PARA DEPENDENCIAS =====

/**
 * Hook para gestión de dependencias con paginación
 */
export function useDependenciasList(params?: {
  activa?: boolean;
  tipo?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useApiCall(
    () => dependenciasService.getDependencias(params),
    [JSON.stringify(params)]
  );
}

/**
 * Hook para tipos de dependencias
 */
export function useTiposDependencias() {
  return useApiCall(
    () => dependenciasService.getTiposDependencias(),
    []
  );
}

// ===== HOOKS PARA MUTACIONES =====

interface MutationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>
) {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const mutate = useCallback(async (params: P) => {
    setState({ loading: true, error: null, success: false });
    
    try {
      const result = await mutationFn(params);
      setState({ loading: false, error: null, success: true });
      return result;
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false,
      });
      throw error;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return { ...state, mutate, reset };
}

/**
 * Hook para crear estadística
 */
export function useCreateEstadistica() {
  return useMutation((data: Partial<Estadistica>) =>
    statisticsService.createEstadistica(data)
  );
}

/**
 * Hook para actualizar estadística
 */
export function useUpdateEstadistica() {
  return useMutation(({ id, data }: { id: number; data: Partial<Estadistica> }) =>
    statisticsService.updateEstadistica(id, data)
  );
}

/**
 * Hook para sincronización
 */
export function useSyncEstadisticas() {
  return useMutation((params: { secret: string; dependencyName?: string }) =>
    adminService.sincronizar(params)
  );
}

/**
 * Hook para crear dependencia
 */
export function useCreateDependencia() {
  return useMutation((data: {
    nombre: string;
    codigo?: string;
    tipo?: string;
    jurisdiccion?: string;
    activa?: boolean;
  }) => dependenciasService.createDependencia(data));
}

// ===== HOOKS COMPUESTOS =====

/**
 * Hook para gestión completa de una página de estadísticas
 */
export function useEstadisticasPage(initialFiltros: EstadisticasFiltros = {}) {
  const [filtros, setFiltros] = useState(initialFiltros);
  const estadisticas = useEstadisticas(filtros);
  const dependencias = useDependencias();
  const periodos = usePeriodos();

  const updateFiltros = useCallback((newFiltros: Partial<EstadisticasFiltros>) => {
    setFiltros(prev => ({ ...prev, ...newFiltros }));
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltros(initialFiltros);
  }, [initialFiltros]);

  return {
    // Estado
    estadisticas: estadisticas.data?.data || [],
    dependencias: dependencias.data || [],
    periodos: periodos.data || [],
    pagination: estadisticas.data?.pagination,
    loading: estadisticas.loading || dependencias.loading || periodos.loading,
    error: estadisticas.error || dependencias.error || periodos.error,
    
    // Filtros
    filtros,
    updateFiltros,
    resetFiltros,
    
    // Acciones
    refetch: estadisticas.refetch,
  };
}

/**
 * Hook para gestión del dashboard
 */
export function useDashboardPage(periodo: string) {
  const dashboard = useDashboard(periodo);
  const sync = useSyncEstadisticas();

  const handleSync = useCallback(async (secret: string) => {
    try {
      await sync.mutate({ secret });
      // Refrescar dashboard después de sync exitoso
      if (sync.success) {
        dashboard.refetch();
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
    }
  }, [sync, dashboard]);

  return {
    // Estado del dashboard
    dashboard: dashboard.data,
    loading: dashboard.loading,
    error: dashboard.error,
    
    // Estado de sincronización
    syncing: sync.loading,
    syncError: sync.error,
    syncSuccess: sync.success,
    
    // Acciones
    refetch: dashboard.refetch,
    handleSync,
    resetSync: sync.reset,
  };
}