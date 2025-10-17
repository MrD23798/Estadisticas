import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface MasterSheetRow {
  plantilla: string;
  numero: number;
  anio: number;
  mes: number;
  idOriginal: string;
  idConfirmado: string;
  estado: string;
}

export interface DependencyData {
  id: string;
  plantilla: string;
  numero: number;
  anio: number;
  mes: number;
  data: any[]; // Datos del sheet individual
}

export interface ProcessedStatistics {
  previsional: DependencyData[];
  tributaria: DependencyData[];
  sala: DependencyData[];
}

class MasterSheetsService {
  private masterDoc: GoogleSpreadsheet | null = null;
  private isAuthenticated = false;
  private serviceAccountAuth: JWT | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!serviceAccountEmail || !privateKey) {
        throw new Error('Missing Google Sheets configuration in environment variables');
      }

      // Create JWT auth
      this.serviceAccountAuth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      this.isAuthenticated = true;
      console.log('Master Sheets service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Master Sheets service:', error);
      throw error;
    }
  }

  async loadMasterSheet(masterSheetId: string): Promise<MasterSheetRow[]> {
    try {
      if (!this.isAuthenticated || !this.serviceAccountAuth) {
        throw new Error('Service not authenticated');
      }

      // Initialize the master sheet
      this.masterDoc = new GoogleSpreadsheet(masterSheetId, this.serviceAccountAuth);
      await this.masterDoc.loadInfo();

      console.log(`Master sheet loaded: ${this.masterDoc.title}`);

      // Get the first sheet (assuming master data is in the first sheet)
      const sheet = this.masterDoc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      const masterData: MasterSheetRow[] = [];

      for (const row of rows) {
        // Skip empty rows
        if (!row.get('Plantilla') || !row.get('ID_CONFIRMADO')) {
          continue;
        }

        masterData.push({
          plantilla: row.get('Plantilla') || '',
          numero: parseInt(row.get('Numero')) || 0,
          anio: parseInt(row.get('ANIO')) || 0,
          mes: parseInt(row.get('MES')) || 0,
          idOriginal: row.get('ID_ORIGINAL') || '',
          idConfirmado: row.get('ID_CONFIRMADO') || '',
          estado: row.get('Estado') || '',
        });
      }

      console.log(`Loaded ${masterData.length} entries from master sheet`);
      return masterData;
    } catch (error) {
      console.error('Failed to load master sheet:', error);
      throw error;
    }
  }

  async loadIndividualSheet(sheetId: string): Promise<any[]> {
    try {
      if (!this.serviceAccountAuth) {
        throw new Error('Service not authenticated');
      }

      const doc = new GoogleSpreadsheet(sheetId, this.serviceAccountAuth);
      await doc.loadInfo();

      // Get the first sheet
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      const data: any[] = [];

      for (const row of rows) {
        // Convert row to object
        const rowData: any = {};
        
        // Get all headers and their values
        const headers = sheet.headerValues;
        for (const header of headers) {
          rowData[header] = row.get(header) || '';
        }

        data.push(rowData);
      }

      console.log(`Loaded ${data.length} rows from sheet ${sheetId}`);
      return data;
    } catch (error) {
      console.error(`Failed to load individual sheet ${sheetId}:`, error);
      return []; // Return empty array instead of throwing to continue processing other sheets
    }
  }

  async processAllStatistics(masterSheetId: string, year: number, month: number): Promise<ProcessedStatistics> {
    try {
      // Load master sheet data
      const masterData = await this.loadMasterSheet(masterSheetId);

      // Filter by year and month
      const filteredData = masterData.filter(row => 
        row.anio === year && row.mes === month && row.idConfirmado
      );

      const result: ProcessedStatistics = {
        previsional: [],
        tributaria: [],
        sala: []
      };

      // Process each entry
      for (const entry of filteredData) {
        try {
          const individualData = await this.loadIndividualSheet(entry.idConfirmado);
          
          const dependencyData: DependencyData = {
            id: entry.idConfirmado,
            plantilla: entry.plantilla,
            numero: entry.numero,
            anio: entry.anio,
            mes: entry.mes,
            data: individualData
          };

          // Categorize by type
          if (entry.plantilla.includes('Previsional')) {
            result.previsional.push(dependencyData);
          } else if (entry.plantilla.includes('Tributaria')) {
            result.tributaria.push(dependencyData);
          } else if (entry.plantilla.includes('Sala')) {
            result.sala.push(dependencyData);
          }
        } catch (error) {
          console.error(`Failed to process sheet ${entry.idConfirmado}:`, error);
          // Continue processing other sheets
        }
      }

      console.log(`Processed statistics for ${year}/${month}:`);
      console.log(`- Previsional: ${result.previsional.length} juzgados`);
      console.log(`- Tributaria: ${result.tributaria.length} juzgados`);
      console.log(`- Sala: ${result.sala.length} salas`);

      return result;
    } catch (error) {
      console.error('Failed to process all statistics:', error);
      throw error;
    }
  }

  async getAvailablePeriods(masterSheetId: string): Promise<{year: number, month: number}[]> {
    try {
      const masterData = await this.loadMasterSheet(masterSheetId);
      
      const periods = new Set<string>();
      masterData.forEach(row => {
        if (row.anio && row.mes) {
          periods.add(`${row.anio}-${row.mes}`);
        }
      });

      return Array.from(periods).map(period => {
        const [year, month] = period.split('-').map(Number);
        return { year, month };
      }).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year; // Newest year first
        return b.month - a.month; // Newest month first
      });
    } catch (error) {
      console.error('Failed to get available periods:', error);
      return [];
    }
  }

  isReady(): boolean {
    return this.isAuthenticated;
  }
}

export const masterSheetsService = new MasterSheetsService();