import { useState, useEffect, useCallback } from 'react';
import { mockDataService } from '../services/mockDataService';
import { dataService as realDataService } from '../services/dataService';
import type { SheetData, ComparisonData, SyncStatus, SyncConfig } from '../services/mockDataService';

// Use mock service for browser development to avoid MySQL2 errors
const dataService = mockDataService;

export interface UseDataServiceReturn {
  // Data
  chartData: SheetData[];
  comparisonData: { dataA: SheetData[]; dataB: SheetData[] };
  
  // Loading states
  isLoading: boolean;
  isChartLoading: boolean;
  isComparisonLoading: boolean;
  
  // Error states
  error: string | null;
  chartError: string | null;
  comparisonError: string | null;
  
  // Sync status
  syncStatus: SyncStatus;
  
  // Actions
  refreshChartData: () => Promise<void>;
  refreshComparisonData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  syncData: () => Promise<void>;
  startAutoSync: () => Promise<void>;
  stopAutoSync: () => void;
  
  // Service status
  isServiceReady: boolean;
  connectionStatus: {
    dataService: boolean;
    mysql: boolean;
    googleSheets: boolean;
    syncService: boolean;
  } | null;
  testConnections: () => Promise<void>;
}

export const useDataService = (): UseDataServiceReturn => {
  // Data states
  const [chartData, setChartData] = useState<SheetData[]>([]);
  const [comparisonData, setComparisonData] = useState<{ dataA: SheetData[]; dataB: SheetData[] }>({
    dataA: [],
    dataB: [],
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    nextSync: null,
    lastError: null,
    syncCount: 0,
  });

  // Service status
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    dataService: boolean;
    mysql: boolean;
    googleSheets: boolean;
    syncService: boolean;
  } | null>(null);

  // Define data loading functions first
  const loadChartData = useCallback(async () => {
    try {
      setIsChartLoading(true);
      setChartError(null);
      
      const data = await dataService.getChartData();
      setChartData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      setChartError(errorMessage);
      console.error('Chart data loading error:', err);
    } finally {
      setIsChartLoading(false);
    }
  }, []);

  const loadComparisonData = useCallback(async () => {
    try {
      setIsComparisonLoading(true);
      setComparisonError(null);
      
      const data = await dataService.getComparisonData();
      setComparisonData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comparison data';
      setComparisonError(errorMessage);
      console.error('Comparison data loading error:', err);
    } finally {
      setIsComparisonLoading(false);
    }
  }, []);

  const updateSyncStatus = useCallback(() => {
    try {
      const status = dataService.getSyncStatus();
      setSyncStatus(status);
    } catch (err) {
      console.error('Failed to update sync status:', err);
    }
  }, []);

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!dataService.isReady()) {
          await dataService.initialize();
        }

        setIsServiceReady(true);
        
        // Load initial data
        await Promise.all([
          loadChartData(),
          loadComparisonData(),
        ]);

        // Update sync status
        updateSyncStatus();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize data service';
        setError(errorMessage);
        console.error('Data service initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, []);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!isServiceReady) return;

    // Refresh data every 2 minutes
    const dataRefreshInterval = setInterval(async () => {
      console.log('Auto-refreshing data...');
      try {
        await Promise.all([
          loadChartData(),
          loadComparisonData(),
        ]);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Update sync status every 10 seconds
    const statusInterval = setInterval(() => {
      updateSyncStatus();
    }, 10000);

    return () => {
      clearInterval(dataRefreshInterval);
      clearInterval(statusInterval);
    };
  }, [isServiceReady, loadChartData, loadComparisonData]);

  const refreshChartData = useCallback(async () => {
    await loadChartData();
  }, [loadChartData]);

  const refreshComparisonData = useCallback(async () => {
    await loadComparisonData();
  }, [loadComparisonData]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      loadChartData(),
      loadComparisonData(),
    ]);
  }, [loadChartData, loadComparisonData]);

  const syncData = useCallback(async () => {
    try {
      setError(null);
      await dataService.syncData();
      
      // Refresh data after sync
      await refreshAllData();
      
      // Update sync status
      updateSyncStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      console.error('Data sync error:', err);
      throw err;
    }
  }, [refreshAllData, updateSyncStatus]);

  const startAutoSync = useCallback(async () => {
    try {
      setError(null);
      await dataService.startAutoSync();
      updateSyncStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start auto sync';
      setError(errorMessage);
      console.error('Auto sync start error:', err);
      throw err;
    }
  }, [updateSyncStatus]);

  const stopAutoSync = useCallback(() => {
    try {
      dataService.stopAutoSync();
      updateSyncStatus();
    } catch (err) {
      console.error('Auto sync stop error:', err);
    }
  }, [updateSyncStatus]);

  const testConnections = useCallback(async () => {
    try {
      const status = await dataService.testConnections();
      setConnectionStatus(status);
    } catch (err) {
      console.error('Connection test error:', err);
      setConnectionStatus({
        dataService: false,
        mysql: false,
        googleSheets: false,
        syncService: false,
      });
    }
  }, []);

  return {
    // Data
    chartData,
    comparisonData,
    
    // Loading states
    isLoading,
    isChartLoading,
    isComparisonLoading,
    
    // Error states
    error,
    chartError,
    comparisonError,
    
    // Sync status
    syncStatus,
    
    // Actions
    refreshChartData,
    refreshComparisonData,
    refreshAllData,
    syncData,
    startAutoSync,
    stopAutoSync,
    
    // Service status
    isServiceReady,
    connectionStatus,
    testConnections,
  };
};