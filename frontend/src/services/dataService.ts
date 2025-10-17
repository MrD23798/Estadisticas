import { mysqlService } from './mysqlService';
import { syncService } from './syncService';
import { autoSyncService } from './autoSyncService';
import { SheetData } from './googleSheetsService';

export interface DataServiceConfig {
  autoInitialize: boolean;
  fallbackToMockData: boolean;
  enableAutoSync: boolean;
}

class DataService {
  private isInitialized = false;
  private config: DataServiceConfig;

  constructor() {
    this.config = {
      autoInitialize: true,
      fallbackToMockData: true,
      enableAutoSync: true,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing data service...');
      
      // Initialize sync service (which will handle MySQL and Google Sheets connections)
      await syncService.initialize();
      
      // Test connections
      const connectionStatus = await syncService.testConnection();
      
      if (!connectionStatus.mysql) {
        console.warn('MySQL connection failed, will use fallback mode');
      }

      if (!connectionStatus.googleSheets) {
        console.warn('Google Sheets connection failed, but continuing with MySQL only');
      }

      // Start auto sync service if enabled and at least one connection is available
      if (this.config.enableAutoSync && (connectionStatus.mysql || connectionStatus.googleSheets)) {
        autoSyncService.start();
        console.log('Auto sync service started');
      }

      this.isInitialized = true;
      console.log('Data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      
      if (!this.config.fallbackToMockData) {
        throw error;
      }
      
      console.log('Falling back to mock data mode');
      this.isInitialized = true;
    }
  }

  async getChartData(): Promise<SheetData[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Si el auto sync está habilitado, forzar una verificación
      if (this.config.enableAutoSync && autoSyncService.getStatus().isRunning) {
        await autoSyncService.forceCheck();
      }

      if (mysqlService.isConnected()) {
        const data = await mysqlService.getChartData();
        
        // If no data in database, try to sync from Google Sheets first
        if (data.length === 0) {
          console.log('No chart data in database, attempting to sync from Google Sheets...');
          try {
            await syncService.syncChartData();
            const syncedData = await mysqlService.getChartData();
            if (syncedData.length > 0) {
              return syncedData;
            }
          } catch (syncError) {
            console.warn('Failed to sync chart data from Google Sheets:', syncError);
          }
          
          // If sync failed and fallback is enabled, return mock data
          if (this.config.fallbackToMockData) {
            console.log('Sync failed, returning mock chart data');
            return this.getMockChartData();
          }
        }
        
        return data;
      } else if (this.config.fallbackToMockData) {
        console.log('MySQL not connected, returning mock chart data');
        return this.getMockChartData();
      } else {
        throw new Error('No database connection available');
      }
    } catch (error) {
      console.error('Failed to get chart data:', error);
      
      if (this.config.fallbackToMockData) {
        console.log('Error getting chart data, falling back to mock data');
        return this.getMockChartData();
      }
      
      throw error;
    }
  }

  async getComparisonData(): Promise<{ dataA: SheetData[]; dataB: SheetData[] }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Si el auto sync está habilitado, forzar una verificación
      if (this.config.enableAutoSync && autoSyncService.getStatus().isRunning) {
        await autoSyncService.forceCheck();
      }

      if (mysqlService.isConnected()) {
        const data = await mysqlService.getComparisonData();
        
        // If no data in database, try to sync from Google Sheets first
        if (data.dataA.length === 0 || data.dataB.length === 0) {
          console.log('No comparison data in database, attempting to sync from Google Sheets...');
          try {
            await syncService.syncComparisonData();
            const syncedData = await mysqlService.getComparisonData();
            if (syncedData.dataA.length > 0 && syncedData.dataB.length > 0) {
              return syncedData;
            }
          } catch (syncError) {
            console.warn('Failed to sync comparison data from Google Sheets:', syncError);
          }
          
          // If sync failed and fallback is enabled, return mock data
          if (this.config.fallbackToMockData) {
            console.log('Sync failed, returning mock comparison data');
            return this.getMockComparisonData();
          }
        }
        
        return data;
      } else if (this.config.fallbackToMockData) {
        console.log('MySQL not connected, returning mock comparison data');
        return this.getMockComparisonData();
      } else {
        throw new Error('No database connection available');
      }
    } catch (error) {
      console.error('Failed to get comparison data:', error);
      
      if (this.config.fallbackToMockData) {
        console.log('Error getting comparison data, falling back to mock data');
        return this.getMockComparisonData();
      }
      
      throw error;
    }
  }

  async syncData(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await syncService.performSync();
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  }

  async startAutoSync(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await syncService.startAutoSync();
    } catch (error) {
      console.error('Failed to start auto sync:', error);
      throw error;
    }
  }

  stopAutoSync(): void {
    syncService.stopAutoSync();
  }

  getSyncStatus() {
    return syncService.getStatus();
  }

  async getLastSyncTimes() {
    return syncService.getLastSyncTimes();
  }

  updateConfig(newConfig: Partial<DataServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DataServiceConfig {
    return { ...this.config };
  }

  private getMockChartData(): SheetData[] {
    return [
      { id: '1', objectType: 'Usuarios', count: 150 },
      { id: '2', objectType: 'Productos', count: 89 },
      { id: '3', objectType: 'Ventas', count: 234 },
      { id: '4', objectType: 'Categorías', count: 45 },
      { id: '5', objectType: 'Pedidos', count: 178 },
    ];
  }

  private getMockComparisonData(): { dataA: SheetData[]; dataB: SheetData[] } {
    return {
      dataA: [
        { id: '1', objectType: 'Enero', count: 120 },
        { id: '2', objectType: 'Febrero', count: 95 },
        { id: '3', objectType: 'Marzo', count: 180 },
        { id: '4', objectType: 'Abril', count: 165 },
      ],
      dataB: [
        { id: '1', objectType: 'Enero', count: 110 },
        { id: '2', objectType: 'Febrero', count: 105 },
        { id: '3', objectType: 'Marzo', count: 190 },
        { id: '4', objectType: 'Abril', count: 155 },
      ],
    };
  }

  async testConnections(): Promise<{
    dataService: boolean;
    mysql: boolean;
    googleSheets: boolean;
    syncService: boolean;
  }> {
    const result = {
      dataService: this.isInitialized,
      mysql: false,
      googleSheets: false,
      syncService: false,
    };

    try {
      if (!this.isInitialized) {
        await this.initialize();
        result.dataService = this.isInitialized;
      }

      const connectionStatus = await syncService.testConnection();
      result.mysql = connectionStatus.mysql;
      result.googleSheets = connectionStatus.googleSheets;
      result.syncService = connectionStatus.mysql; // Sync service needs at least MySQL
    } catch (error) {
      console.error('Connection test failed:', error);
    }

    return result;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;