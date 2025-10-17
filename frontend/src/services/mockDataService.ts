// Mock data service for browser development
export interface SheetData {
  category: string;
  value: number;
  date: string;
}

export interface ComparisonData {
  dataA: SheetData[];
  dataB: SheetData[];
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  error: string | null;
}

export interface SyncConfig {
  intervalMinutes: number;
  autoSync: boolean;
}

// Mock data
const mockChartData: SheetData[] = [
  { category: 'Juzgado 1', value: 150, date: '2024-01-01' },
  { category: 'Juzgado 2', value: 200, date: '2024-01-01' },
  { category: 'Juzgado 3', value: 175, date: '2024-01-01' },
  { category: 'Juzgado 4', value: 120, date: '2024-01-01' },
  { category: 'Juzgado 5', value: 180, date: '2024-01-01' },
  { category: 'Sala 1', value: 90, date: '2024-01-01' },
  { category: 'Sala 2', value: 110, date: '2024-01-01' },
  { category: 'Sala 3', value: 95, date: '2024-01-01' },
];

const mockComparisonDataA: SheetData[] = [
  { category: 'Juzgado 1', value: 140, date: '2024-01-01' },
  { category: 'Juzgado 2', value: 190, date: '2024-01-01' },
  { category: 'Juzgado 3', value: 165, date: '2024-01-01' },
  { category: 'Juzgado 4', value: 110, date: '2024-01-01' },
  { category: 'Juzgado 5', value: 170, date: '2024-01-01' },
];

const mockComparisonDataB: SheetData[] = [
  { category: 'Juzgado 1', value: 160, date: '2024-01-01' },
  { category: 'Juzgado 2', value: 210, date: '2024-01-01' },
  { category: 'Juzgado 3', value: 185, date: '2024-01-01' },
  { category: 'Juzgado 4', value: 130, date: '2024-01-01' },
  { category: 'Juzgado 5', value: 190, date: '2024-01-01' },
];

class MockDataService {
  private syncStatus: SyncStatus = {
    isRunning: false,
    lastSync: new Date().toISOString(),
    error: null
  };

  private syncConfig: SyncConfig = {
    intervalMinutes: 30,
    autoSync: true
  };

  private isInitialized = false;

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isInitialized = true;
    console.log('Mock Data Service initialized');
  }

  async getChartData(): Promise<SheetData[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockChartData];
  }

  async getComparisonData(): Promise<ComparisonData> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      dataA: [...mockComparisonDataA],
      dataB: [...mockComparisonDataB]
    };
  }

  async syncData(): Promise<void> {
    this.syncStatus.isRunning = true;
    this.syncStatus.error = null;

    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.syncStatus.lastSync = new Date().toISOString();
      console.log('Mock data synchronized successfully');
    } catch (error) {
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      throw error;
    } finally {
      this.syncStatus.isRunning = false;
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getSyncConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  async updateSyncConfig(config: Partial<SyncConfig>): Promise<void> {
    this.syncConfig = { ...this.syncConfig, ...config };
    console.log('Mock sync config updated:', this.syncConfig);
  }

  async startAutoSync(): Promise<void> {
    this.syncConfig.autoSync = true;
    console.log('Mock auto-sync started');
  }

  async stopAutoSync(): Promise<void> {
    this.syncConfig.autoSync = false;
    console.log('Mock auto-sync stopped');
  }

  async testConnections(): Promise<{ googleSheets: boolean; mysql: boolean }> {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      googleSheets: true,
      mysql: true
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async disconnect(): Promise<void> {
    this.isInitialized = false;
    console.log('Mock Data Service disconnected');
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
export default mockDataService;