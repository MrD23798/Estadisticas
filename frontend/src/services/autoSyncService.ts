import { mysqlService } from './mysqlService';
import { googleSheetsService } from './googleSheetsService';
import { syncService } from './syncService';

interface AutoSyncConfig {
  checkInterval: number; // en milisegundos
  dataExpirationTime: number; // en milisegundos
  maxRetries: number;
  retryDelay: number; // en milisegundos
}

interface DataFreshness {
  chartData: Date | null;
  comparisonData: Date | null;
}

class AutoSyncService {
  private config: AutoSyncConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheck: DataFreshness = {
    chartData: null,
    comparisonData: null
  };

  constructor(config: Partial<AutoSyncConfig> = {}) {
    this.config = {
      checkInterval: 5 * 60 * 1000, // 5 minutos por defecto
      dataExpirationTime: 30 * 60 * 1000, // 30 minutos por defecto
      maxRetries: 3,
      retryDelay: 5000, // 5 segundos
      ...config
    };
  }

  /**
   * Inicia el servicio de sincronización automática
   */
  start(): void {
    if (this.isRunning) {
      console.log('AutoSyncService ya está ejecutándose');
      return;
    }

    this.isRunning = true;
    console.log('Iniciando AutoSyncService...');
    
    // Ejecutar verificación inicial
    this.performCheck();
    
    // Configurar verificación periódica
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.config.checkInterval);
  }

  /**
   * Detiene el servicio de sincronización automática
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('AutoSyncService detenido');
  }

  /**
   * Verifica si los datos están disponibles y actualizados en la base de datos
   */
  private async performCheck(): Promise<void> {
    try {
      console.log('Verificando disponibilidad de datos...');
      
      // Verificar datos del gráfico
      await this.checkAndSyncChartData();
      
      // Verificar datos de comparación
      await this.checkAndSyncComparisonData();
      
    } catch (error) {
      console.error('Error durante la verificación automática:', error);
    }
  }

  /**
   * Verifica y sincroniza datos del gráfico si es necesario
   */
  private async checkAndSyncChartData(): Promise<void> {
    try {
      const needsSync = await this.checkIfDataNeedsSync('chart');
      
      if (needsSync) {
        console.log('Sincronizando datos del gráfico desde Google Sheets...');
        await this.syncDataWithRetry('chart');
        this.lastCheck.chartData = new Date();
      }
    } catch (error) {
      console.error('Error al verificar/sincronizar datos del gráfico:', error);
    }
  }

  /**
   * Verifica y sincroniza datos de comparación si es necesario
   */
  private async checkAndSyncComparisonData(): Promise<void> {
    try {
      const needsSync = await this.checkIfDataNeedsSync('comparison');
      
      if (needsSync) {
        console.log('Sincronizando datos de comparación desde Google Sheets...');
        await this.syncDataWithRetry('comparison');
        this.lastCheck.comparisonData = new Date();
      }
    } catch (error) {
      console.error('Error al verificar/sincronizar datos de comparación:', error);
    }
  }

  /**
   * Verifica si los datos necesitan sincronización
   */
  private async checkIfDataNeedsSync(dataType: 'chart' | 'comparison'): Promise<boolean> {
    try {
      // Verificar si la conexión a MySQL está disponible
      const isConnected = await mysqlService.testConnection();
      if (!isConnected) {
        console.log('MySQL no disponible, usando datos mock');
        return false;
      }

      // Verificar si existen datos en la base de datos
      const hasData = await this.checkDataExists(dataType);
      if (!hasData) {
        console.log(`No hay datos de ${dataType} en la base de datos`);
        return true;
      }

      // Verificar si los datos están desactualizados
      const isStale = await this.checkDataIsStale(dataType);
      if (isStale) {
        console.log(`Datos de ${dataType} están desactualizados`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error al verificar necesidad de sincronización para ${dataType}:`, error);
      return false;
    }
  }

  /**
   * Verifica si existen datos en la base de datos
   */
  private async checkDataExists(dataType: 'chart' | 'comparison'): Promise<boolean> {
    try {
      if (dataType === 'chart') {
        const data = await mysqlService.getChartData();
        return data && data.length > 0;
      } else {
        const data = await mysqlService.getComparisonData();
        return data && data.dataA && data.dataA.length > 0;
      }
    } catch (error) {
      console.error(`Error al verificar existencia de datos ${dataType}:`, error);
      return false;
    }
  }

  /**
   * Verifica si los datos están desactualizados
   */
  private async checkDataIsStale(dataType: 'chart' | 'comparison'): Promise<boolean> {
    try {
      const lastUpdate = dataType === 'chart' 
        ? this.lastCheck.chartData 
        : this.lastCheck.comparisonData;

      if (!lastUpdate) {
        return true; // Si nunca se ha verificado, considerar como desactualizado
      }

      const now = new Date();
      const timeDiff = now.getTime() - lastUpdate.getTime();
      
      return timeDiff > this.config.dataExpirationTime;
    } catch (error) {
      console.error(`Error al verificar antigüedad de datos ${dataType}:`, error);
      return true; // En caso de error, asumir que están desactualizados
    }
  }

  /**
   * Sincroniza datos con reintentos automáticos
   */
  private async syncDataWithRetry(dataType: 'chart' | 'comparison'): Promise<void> {
    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        if (dataType === 'chart') {
          await syncService.syncChartData();
        } else {
          await syncService.syncComparisonData();
        }
        
        console.log(`Sincronización de ${dataType} completada exitosamente`);
        return;
        
      } catch (error) {
        retries++;
        console.error(`Error en intento ${retries} de sincronización de ${dataType}:`, error);
        
        if (retries < this.config.maxRetries) {
          console.log(`Reintentando en ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        } else {
          console.error(`Falló la sincronización de ${dataType} después de ${this.config.maxRetries} intentos`);
          throw error;
        }
      }
    }
  }

  /**
   * Función auxiliar para crear delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene el estado actual del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Fuerza una verificación inmediata
   */
  async forceCheck(): Promise<void> {
    if (!this.isRunning) {
      console.log('AutoSyncService no está ejecutándose');
      return;
    }
    
    console.log('Forzando verificación inmediata...');
    await this.performCheck();
  }
}

// Crear instancia singleton
export const autoSyncService = new AutoSyncService({
  checkInterval: 5 * 60 * 1000, // 5 minutos
  dataExpirationTime: 30 * 60 * 1000, // 30 minutos
  maxRetries: 3,
  retryDelay: 5000
});

export default autoSyncService;