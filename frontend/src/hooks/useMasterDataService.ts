import { useState, useEffect, useCallback } from 'react';
import { mockMasterDataService } from '../services/mockMasterDataService';
import { ChartDataPoint, ComparisonData, SyncStatus } from '../services/masterDataService';
import { StatisticsSummary } from '../services/masterDatabaseService';

export interface UseMasterDataServiceReturn {
  // Data
  chartData: ChartDataPoint[];
  comparisonData: ComparisonData;
  statisticsSummary: StatisticsSummary[];
  availablePeriods: {year: number, month: number}[];
  
  // Loading states
  isLoading: boolean;
  isChartLoading: boolean;
  isComparisonLoading: boolean;
  isSummaryLoading: boolean;
  
  // Error states
  error: string | null;
  chartError: string | null;
  comparisonError: string | null;
  summaryError: string | null;
  
  // Sync status
  syncStatus: SyncStatus;
  
  // Actions
  refreshChartData: (year?: number, month?: number) => Promise<void>;
  refreshComparisonData: (yearA?: number, monthA?: number, yearB?: number, monthB?: number) => Promise<void>;
  refreshSummary: (year?: number, month?: number) => Promise<void>;
  refreshAllData: () => Promise<void>;
  syncData: (year?: number, month?: number) => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;
  loadAvailablePeriods: () => Promise<void>;
  
  // Service status
  isServiceReady: boolean;
  connectionStatus: {
    database: boolean;
    googleSheets: boolean;
  } | null;
  testConnections: () => Promise<void>;
}

export function useMasterDataService(): UseMasterDataServiceReturn {
  // Data states
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData>({ dataA: [], dataB: [] });
  const [statisticsSummary, setStatisticsSummary] = useState<StatisticsSummary[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<{year: number, month: number}[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  // Service states
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSync: null,
    nextSync: null,
    status: 'idle',
    message: 'Inicializando...',
  });
  const [connectionStatus, setConnectionStatus] = useState<{
    mysql: boolean;
    googleSheets: boolean;
  }>({ mysql: false, googleSheets: false });

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await mockMasterDataService.initialize();
        setIsServiceReady(true);
        
        // Load initial data
        await loadInitialData();
        
        console.log('Master data service initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error al inicializar el servicio: ${errorMessage}`);
        console.error('Failed to initialize master data service:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(mockMasterDataService.getSyncStatus());
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadChartData(),
      loadComparisonData(),
      loadSummary(),
      loadAvailablePeriods(),
    ]);
  }, []);

  const loadChartData = useCallback(async () => {
    try {
      setIsChartLoading(true);
      setChartError(null);
      
      const data = await mockMasterDataService.getChartData();
      setChartData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setChartError(`Error al cargar datos del gráfico: ${errorMessage}`);
      console.error('Failed to load chart data:', err);
    } finally {
      setIsChartLoading(false);
    }
  }, []);

  const loadComparisonData = useCallback(async () => {
    try {
      setIsComparisonLoading(true);
      setComparisonError(null);
      
      const data = await mockMasterDataService.getComparisonData();
      setComparisonData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setComparisonError(`Error al cargar datos de comparación: ${errorMessage}`);
      console.error('Failed to load comparison data:', err);
    } finally {
      setIsComparisonLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setIsSummaryLoading(true);
      setSummaryError(null);
      
      const data = await mockMasterDataService.getStatisticsSummary();
      setStatisticsSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setSummaryError(`Error al cargar resumen: ${errorMessage}`);
      console.error('Failed to load summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const loadAvailablePeriodsCallback = useCallback(async () => {
    try {
      const periods = await mockMasterDataService.getAvailablePeriods();
      setAvailablePeriods(periods);
    } catch (err) {
      console.error('Failed to load available periods:', err);
    }
  }, []);

  const refreshChartData = useCallback(async () => {
    await loadChartData();
  }, [loadChartData]);

  const refreshComparisonData = useCallback(async () => {
    await loadComparisonData();
  }, [loadComparisonData]);

  const refreshSummary = useCallback(async () => {
    await loadSummary();
  }, [loadSummary]);

  const refreshAllData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const syncData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await mockMasterDataService.synchronize();
      
      // Refresh all data after sync
      await refreshAllData();
      
      console.log('Data synchronized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al sincronizar datos: ${errorMessage}`);
      console.error('Failed to sync data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAllData]);

  const startAutoSync = useCallback(() => {
    mockMasterDataService.startAutoSync();
  }, []);

  const stopAutoSync = useCallback(() => {
    mockMasterDataService.stopAutoSync();
  }, []);

  const testConnections = useCallback(async () => {
    try {
      const status = await mockMasterDataService.testConnection();
      setConnectionStatus({ mysql: status.mysql, googleSheets: status.googleSheets });
    } catch (err) {
      console.error('Failed to test connections:', err);
      setConnectionStatus({ mysql: false, googleSheets: false });
    }
  }, []);

  return {
    // Data
    chartData,
    comparisonData,
    statisticsSummary,
    availablePeriods,
    
    // Loading states
    isLoading,
    
    // Error states
    error,
    
    // Sync status
    syncStatus,
    connectionStatus,
    
    // Actions
    refreshData: refreshAllData,
    synchronize: syncData,
    testConnection: testConnections,
  };
}