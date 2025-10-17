import { masterSheetsService, ProcessedStatistics, DependencyData } from './masterSheetsService';
import { masterDatabaseService, StatisticsSummary } from './masterDatabaseService';

export interface MasterDataServiceConfig {
  masterSheetId: string;
  autoInitialize: boolean;
  fallbackToMockData: boolean;
  enableAutoSync: boolean;
  syncIntervalMinutes: number;
}

export interface ChartDataPoint {
  id: string;
  objectType: string;
  count: number;
  category?: string;
  label?: string;
  value?: number;
}

export interface ComparisonData {
  dataA: ChartDataPoint[];
  dataB: ChartDataPoint[];
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  status: 'idle' | 'syncing' | 'error';
  message: string;
}

class MasterDataService {
  private isInitialized = false;
  private config: MasterDataServiceConfig;
  private syncInterval: NodeJS.Timeout | null = null;
  private currentSyncStatus: SyncStatus;

  constructor() {
    this.config = {
      masterSheetId: process.env.GOOGLE_MASTER_SHEET_ID || '',
      autoInitialize: true,
      fallbackToMockData: true,
      enableAutoSync: true,
      syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
    };

    this.currentSyncStatus = {
      isActive: false,
      lastSync: null,
      nextSync: null,
      status: 'idle',
      message: 'Servicio no inicializado',
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Master Data Service...');
      
      // Test connections
      const connectionStatus = await this.testConnections();
      
      if (!connectionStatus.database) {
        console.warn('Database connection failed');
        if (!this.config.fallbackToMockData) {
          throw new Error('Database connection required');
        }
      }

      if (!connectionStatus.googleSheets) {
        console.warn('Google Sheets connection failed');
        if (!this.config.fallbackToMockData) {
          throw new Error('Google Sheets connection required');
        }
      }

      // Perform initial sync if connections are available
      if (connectionStatus.database && connectionStatus.googleSheets && this.config.masterSheetId) {
        await this.performFullSync();
      }

      // Start auto sync if enabled
      if (this.config.enableAutoSync && connectionStatus.database && connectionStatus.googleSheets) {
        this.startAutoSync();
      }

      this.isInitialized = true;
      this.updateSyncStatus('idle', 'Servicio inicializado correctamente');
      console.log('Master Data Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Master Data Service:', error);
      this.updateSyncStatus('error', `Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      if (!this.config.fallbackToMockData) {
        throw error;
      }
      
      console.log('Falling back to mock data mode');
      this.isInitialized = true;
    }
  }

  async testConnections(): Promise<{ database: boolean; googleSheets: boolean }> {
    const results = {
      database: false,
      googleSheets: false,
    };

    try {
      results.database = await masterDatabaseService.testConnection();
    } catch (error) {
      console.error('Database connection test failed:', error);
    }

    try {
      results.googleSheets = masterSheetsService.isReady();
    } catch (error) {
      console.error('Google Sheets connection test failed:', error);
    }

    return results;
  }

  async performFullSync(year?: number, month?: number): Promise<void> {
    if (!this.config.masterSheetId) {
      throw new Error('Master Sheet ID not configured');
    }

    try {
      this.updateSyncStatus('syncing', 'Sincronizando datos...');

      // Use current year/month if not specified
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      console.log(`Starting full sync for ${targetYear}/${targetMonth}`);

      // Load and process all statistics for the specified period
      const processedStats = await masterSheetsService.processAllStatistics(
        this.config.masterSheetId,
        targetYear,
        targetMonth
      );

      // Store in database
      await masterDatabaseService.processAllStatistics(processedStats);

      this.updateSyncStatus('idle', `Sincronización completada para ${targetYear}/${targetMonth}`);
      console.log(`Full sync completed for ${targetYear}/${targetMonth}`);
    } catch (error) {
      console.error('Full sync failed:', error);
      this.updateSyncStatus('error', `Error en sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  }

  async getChartData(year?: number, month?: number): Promise<ChartDataPoint[]> {
    try {
      if (!masterDatabaseService.isConnected()) {
        console.log('Database not connected, returning mock data');
        return this.getMockChartData();
      }

      const summary = await masterDatabaseService.getStatisticsSummary(year, month);
      
      // Convert summary to chart data format
      const chartData: ChartDataPoint[] = summary.map((item, index) => ({
        id: `${item.plantilla}-${item.numero}-${item.anio}-${item.mes}`,
        objectType: item.plantilla,
        count: item.totalRecords,
        category: this.getPlantillaCategory(item.plantilla),
        label: `${this.getPlantillaShortName(item.plantilla)} #${item.numero}`,
        value: item.totalRecords,
      }));

      return chartData;
    } catch (error) {
      console.error('Failed to get chart data:', error);
      
      if (this.config.fallbackToMockData) {
        console.log('Falling back to mock chart data');
        return this.getMockChartData();
      }
      
      throw error;
    }
  }

  async getComparisonData(yearA?: number, monthA?: number, yearB?: number, monthB?: number): Promise<ComparisonData> {
    try {
      if (!masterDatabaseService.isConnected()) {
        console.log('Database not connected, returning mock comparison data');
        return this.getMockComparisonData();
      }

      // Get data for period A
      const dataA = await this.getChartData(yearA, monthA);
      
      // Get data for period B
      const dataB = await this.getChartData(yearB, monthB);

      return { dataA, dataB };
    } catch (error) {
      console.error('Failed to get comparison data:', error);
      
      if (this.config.fallbackToMockData) {
        console.log('Falling back to mock comparison data');
        return this.getMockComparisonData();
      }
      
      throw error;
    }
  }

  async getAvailablePeriods(): Promise<{year: number, month: number}[]> {
    try {
      if (!this.config.masterSheetId) {
        return [];
      }

      return await masterSheetsService.getAvailablePeriods(this.config.masterSheetId);
    } catch (error) {
      console.error('Failed to get available periods:', error);
      return [];
    }
  }

  async getStatisticsSummary(year?: number, month?: number): Promise<StatisticsSummary[]> {
    try {
      if (!masterDatabaseService.isConnected()) {
        return [];
      }

      return await masterDatabaseService.getStatisticsSummary(year, month);
    } catch (error) {
      console.error('Failed to get statistics summary:', error);
      return [];
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = this.config.syncIntervalMinutes * 60 * 1000;
    
    this.syncInterval = setInterval(async () => {
      try {
        console.log('Auto sync triggered');
        await this.performFullSync();
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, intervalMs);

    // Update next sync time
    const nextSync = new Date(Date.now() + intervalMs);
    this.currentSyncStatus.nextSync = nextSync;
    this.currentSyncStatus.isActive = true;

    console.log(`Auto sync started with ${this.config.syncIntervalMinutes} minute interval`);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.currentSyncStatus.isActive = false;
    this.currentSyncStatus.nextSync = null;
    console.log('Auto sync stopped');
  }

  getSyncStatus(): SyncStatus {
    return { ...this.currentSyncStatus };
  }

  private updateSyncStatus(status: 'idle' | 'syncing' | 'error', message: string): void {
    this.currentSyncStatus.status = status;
    this.currentSyncStatus.message = message;
    
    if (status === 'idle' && this.currentSyncStatus.lastSync === null) {
      this.currentSyncStatus.lastSync = new Date();
    } else if (status === 'idle') {
      this.currentSyncStatus.lastSync = new Date();
    }
  }

  private getPlantillaCategory(plantilla: string): string {
    if (plantilla.includes('Previsional')) return 'previsional';
    if (plantilla.includes('Tributaria')) return 'tributaria';
    if (plantilla.includes('Sala')) return 'sala';
    return 'other';
  }

  private getPlantillaShortName(plantilla: string): string {
    if (plantilla.includes('Previsional')) return 'Previsional';
    if (plantilla.includes('Tributaria')) return 'Tributaria';
    if (plantilla.includes('Sala')) return 'Sala';
    return 'Otro';
  }

  private getMockChartData(): ChartDataPoint[] {
    return [
      { id: 'prev-1', objectType: 'Previsional', count: 150, category: 'previsional', label: 'Previsional #1', value: 150 },
      { id: 'prev-2', objectType: 'Previsional', count: 120, category: 'previsional', label: 'Previsional #2', value: 120 },
      { id: 'trib-1', objectType: 'Tributaria', count: 200, category: 'tributaria', label: 'Tributaria #1', value: 200 },
      { id: 'trib-2', objectType: 'Tributaria', count: 180, category: 'tributaria', label: 'Tributaria #2', value: 180 },
      { id: 'sala-1', objectType: 'Sala', count: 90, category: 'sala', label: 'Sala #1', value: 90 },
      { id: 'sala-2', objectType: 'Sala', count: 85, category: 'sala', label: 'Sala #2', value: 85 },
    ];
  }

  private getMockComparisonData(): ComparisonData {
    return {
      dataA: this.getMockChartData(),
      dataB: this.getMockChartData().map(item => ({
        ...item,
        id: item.id + '-b',
        count: item.count + Math.floor(Math.random() * 20) - 10,
        value: (item.value || 0) + Math.floor(Math.random() * 20) - 10,
      })),
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const masterDataService = new MasterDataService();
export default masterDataService;