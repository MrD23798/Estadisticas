import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface SheetData {
  id: string;
  objectType: string;
  count: number;
  category?: string;
  label?: string;
  value?: number;
  x?: number;
  z?: number;
}

class GoogleSheetsService {
  private doc: GoogleSpreadsheet | null = null;
  private isAuthenticated = false;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const sheetsId = process.env.GOOGLE_SHEETS_ID;
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!sheetsId || !serviceAccountEmail || !privateKey) {
        throw new Error('Missing Google Sheets configuration in environment variables');
      }

      // Create JWT auth
      const serviceAccountAuth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      // Initialize the sheet
      this.doc = new GoogleSpreadsheet(sheetsId, serviceAccountAuth);
      await this.doc.loadInfo();
      this.isAuthenticated = true;

      console.log('Google Sheets service initialized successfully');
      console.log(`Sheet title: ${this.doc.title}`);
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      this.isAuthenticated = false;
    }
  }

  async getChartData(sheetName: string = 'Chart Data'): Promise<SheetData[]> {
    if (!this.isAuthenticated || !this.doc) {
      throw new Error('Google Sheets service not authenticated');
    }

    try {
      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const rows = await sheet.getRows();
      const data: SheetData[] = [];

      for (const row of rows) {
        // Assuming the sheet has columns: id, objectType, count
        const rowData: SheetData = {
          id: row.get('id') || row.get('ID') || '',
          objectType: row.get('objectType') || row.get('object_type') || row.get('Object Type') || '',
          count: parseInt(row.get('count') || row.get('Count') || '0', 10),
        };

        // Optional fields for more complex data
        if (row.get('category') || row.get('Category')) {
          rowData.category = row.get('category') || row.get('Category');
        }
        if (row.get('label') || row.get('Label')) {
          rowData.label = row.get('label') || row.get('Label');
        }
        if (row.get('value') || row.get('Value')) {
          rowData.value = parseFloat(row.get('value') || row.get('Value') || '0');
        }
        if (row.get('x') || row.get('X')) {
          rowData.x = parseFloat(row.get('x') || row.get('X') || '0');
        }
        if (row.get('z') || row.get('Z')) {
          rowData.z = parseFloat(row.get('z') || row.get('Z') || '0');
        }

        if (rowData.id && rowData.objectType) {
          data.push(rowData);
        }
      }

      console.log(`Retrieved ${data.length} rows from sheet "${sheetName}"`);
      return data;
    } catch (error) {
      console.error(`Error fetching data from sheet "${sheetName}":`, error);
      throw error;
    }
  }

  async getComparisonData(sheetNameA: string = 'Comparison A', sheetNameB: string = 'Comparison B'): Promise<{
    dataA: SheetData[];
    dataB: SheetData[];
  }> {
    if (!this.isAuthenticated || !this.doc) {
      throw new Error('Google Sheets service not authenticated');
    }

    try {
      const [dataA, dataB] = await Promise.all([
        this.getChartData(sheetNameA),
        this.getChartData(sheetNameB)
      ]);

      return { dataA, dataB };
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      throw error;
    }
  }

  async getAllSheets(): Promise<string[]> {
    if (!this.isAuthenticated || !this.doc) {
      throw new Error('Google Sheets service not authenticated');
    }

    return Object.keys(this.doc.sheetsByTitle);
  }

  isReady(): boolean {
    return this.isAuthenticated && this.doc !== null;
  }

  async refreshAuth(): Promise<void> {
    this.isAuthenticated = false;
    this.doc = null;
    await this.initializeAuth();
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;