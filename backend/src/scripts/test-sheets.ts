import 'dotenv/config';
import { GoogleSheetsService } from '../services/google.sheets.service';

async function testGoogleSheetsConnection() {
  console.log('🧪 Probando conexión con Google Sheets...\n');

  try {
    const sheetsService = new GoogleSheetsService();
    
    // Probar conexión básica
    console.log('🔍 Verificando conexión...');
    const isConnected = await sheetsService.testConnection();
    
    if (!isConnected) {
      console.log('❌ Google Sheets no está configurado o no hay conexión.');
      console.log('📋 Para configurar Google Sheets:');
      console.log('');
      console.log('OPCIÓN 1 - API Key (más simple, hoja pública):');
      console.log('1. Ve a https://console.developers.google.com/');
      console.log('2. Crea un proyecto o selecciona uno existente');
      console.log('3. Habilita la Google Sheets API');
      console.log('4. Crea credenciales > API Key');
      console.log('5. Agrega GOOGLE_SHEETS_API_KEY=tu_api_key al .env');
      console.log('6. Haz tu hoja pública (Compartir > Cualquiera con el enlace)');
      console.log('');
      console.log('OPCIÓN 2 - Service Account (más seguro, hoja privada):');
      console.log('1. Ve a https://console.developers.google.com/');
      console.log('2. Crea un proyecto o selecciona uno existente');
      console.log('3. Habilita la Google Sheets API');
      console.log('4. Crea credenciales > Cuenta de servicio');
      console.log('5. Descarga el archivo JSON con las credenciales');
      console.log('6. Agrega las variables al .env:');
      console.log('   GOOGLE_SHEETS_CLIENT_EMAIL=email@proyecto.iam.gserviceaccount.com');
      console.log('   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
      console.log('7. Comparte tu hoja con el email de la cuenta de servicio');
      console.log('');
      console.log('En ambos casos agrega:');
      console.log('GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id');
      return;
    }

    // Listar hojas disponibles
    console.log('✅ Conexión exitosa!');
    console.log('📊 Obteniendo hojas disponibles...');
    const sheets = await sheetsService.listAvailableSheets();
    
    console.log(`📋 Hojas encontradas: ${sheets.length}`);
    console.log('');
    sheets.forEach((sheet: any, index: number) => {
      console.log(`  ${index + 1}. ${sheet.name} (ID: ${sheet.id})`);
    });

    // Intentar extraer datos de la primera hoja
    if (sheets.length > 0) {
      console.log('\n📖 Extrayendo datos de muestra...');
      const firstSheet = sheets[0];
      
      if (firstSheet) {
        try {
          const estadisticas = await sheetsService.extractSheetData(firstSheet.name);
          console.log(`✅ Datos extraídos exitosamente de "${firstSheet.name}"`);
          console.log(`📊 Estadísticas encontradas: ${estadisticas.length}`);
          
          if (estadisticas.length > 0) {
            const muestra = estadisticas[0];
            if (muestra) {
              console.log('\n📋 Muestra de datos:');
              console.log(`  Dependencia: ${muestra.dependencia}`);
              console.log(`  Período: ${muestra.periodo}`);
              console.log(`  Existentes: ${muestra.expedientesExistentes}`);
              console.log(`  Recibidos: ${muestra.expedientesRecibidos}`);
              console.log(`  Reingresados: ${muestra.expedientesReingresados}`);
            }
          }
        } catch (extractError) {
          console.log(`⚠️ No se pudieron extraer datos de "${firstSheet.name}": ${(extractError as Error).message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error al conectar con Google Sheets:');
    console.error((error as Error).message);
    console.log('');
    console.log('🔍 Posibles causas:');
    console.log('1. API Key inválida o expirada');
    console.log('2. Service Account mal configurado');
    console.log('3. Spreadsheet ID incorrecto');
    console.log('4. Falta de permisos en la hoja');
    console.log('5. Hoja no existe o no es accesible');
  }
}

// Ejecutar el test
testGoogleSheetsConnection()
  .then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el test:', error);
    process.exit(1);
  });