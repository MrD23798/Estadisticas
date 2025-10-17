import { ChartDataPoint, ComparisonData, SyncStatus } from './masterDataService';
import { StatisticsSummary } from './masterDatabaseService';

export interface MockMasterDataService {
  initialize(): Promise<void>;
  testConnection(): Promise<{ mysql: boolean; googleSheets: boolean }>;
  synchronize(): Promise<void>;
  getChartData(): Promise<ChartDataPoint[]>;
  getComparisonData(): Promise<ComparisonData[]>;
  getStatisticsSummary(): Promise<StatisticsSummary[]>;
  getAvailablePeriods(): Promise<{ year: number; month: number }[]>;
  getSyncStatus(): SyncStatus;
  startAutoSync(): void;
  stopAutoSync(): void;
}

class MockMasterDataServiceImpl implements MockMasterDataService {
  private syncStatus: SyncStatus = {
    isActive: false,
    lastSync: null,
    nextSync: null,
    error: null
  };

  private autoSyncInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock Master Data Service initialized');
  }

  async testConnection(): Promise<{ mysql: boolean; googleSheets: boolean }> {
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 500));
    return { mysql: true, googleSheets: true };
  }

  async synchronize(): Promise<void> {
    this.syncStatus.isActive = true;
    this.syncStatus.error = null;
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.syncStatus.isActive = false;
    this.syncStatus.lastSync = new Date();
    this.syncStatus.nextSync = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  }

  async getChartData(): Promise<ChartDataPoint[]> {
    // Generate mock chart data
    const data: ChartDataPoint[] = [];
    const plantillas = [
      'Estadística Mensual de Juzgado Secretaría Previsional',
      'Estadística Mensual de Juzgado Secretaría Tributaria',
      'Estadística Mensual de Sala'
    ];

    plantillas.forEach((plantilla, plantillaIndex) => {
      const numDependencies = plantilla.includes('Sala') ? 3 : 10;
      
      for (let numero = 1; numero <= numDependencies; numero++) {
        for (let month = 2; month <= 4; month++) {
          // Generate random data points for each dependency
          const baseValue = 100 + Math.random() * 200;
          for (let i = 0; i < 20; i++) {
            data.push({
              id: `${plantilla}-${numero}-2024-${month}-${i}`,
              plantilla,
              numero,
              year: 2024,
              month,
              category: `Categoría ${String.fromCharCode(65 + (i % 5))}`, // A, B, C, D, E
              value: Math.round(baseValue + (Math.random() - 0.5) * 50),
              date: new Date(2024, month - 1, Math.floor(Math.random() * 28) + 1)
            });
          }
        }
      }
    });

    return data;
  }

  async getComparisonData(): Promise<ComparisonData[]> {
    // Generate mock comparison data
    const data: ComparisonData[] = [];
    const plantillas = [
      'Estadística Mensual de Juzgado Secretaría Previsional',
      'Estadística Mensual de Juzgado Secretaría Tributaria',
      'Estadística Mensual de Sala'
    ];

    plantillas.forEach((plantilla) => {
      const numDependencies = plantilla.includes('Sala') ? 3 : 10;
      
      for (let numero = 1; numero <= numDependencies; numero++) {
        for (let month = 2; month <= 4; month++) {
          data.push({
            id: `${plantilla}-${numero}-2024-${month}`,
            plantilla,
            numero,
            year: 2024,
            month,
            valueA: Math.round(100 + Math.random() * 200),
            valueB: Math.round(100 + Math.random() * 200),
            category: 'Comparación General'
          });
        }
      }
    });

    return data;
  }

  async getStatisticsSummary(): Promise<StatisticsSummary[]> {
    // Generate mock statistics summary
    const data: StatisticsSummary[] = [];
    const plantillas = [
      'Estadística Mensual de Juzgado Secretaría Previsional',
      'Estadística Mensual de Juzgado Secretaría Tributaria',
      'Estadística Mensual de Sala'
    ];

    plantillas.forEach((plantilla) => {
      const numDependencies = plantilla.includes('Sala') ? 3 : 10;
      
      for (let numero = 1; numero <= numDependencies; numero++) {
        for (let month = 2; month <= 4; month++) {
          data.push({
            plantilla,
            numero,
            anio: 2024,
            mes: month,
            totalRecords: Math.round(500 + Math.random() * 1000),
            lastUpdated: new Date(2024, month - 1, Math.floor(Math.random() * 28) + 1)
          });
        }
      }
    });

    return data;
  }

  async getAvailablePeriods(): Promise<{ year: number; month: number }[]> {
    return [
      { year: 2024, month: 2 },
      { year: 2024, month: 3 },
      { year: 2024, month: 4 }
    ];
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(async () => {
      await this.synchronize();
    }, 5 * 60 * 1000); // Every 5 minutes

    console.log('Auto-sync started (mock)');
  }

  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
    console.log('Auto-sync stopped (mock)');
  }
}

export const mockMasterDataService = new MockMasterDataServiceImpl();