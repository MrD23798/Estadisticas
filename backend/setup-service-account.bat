@echo off
echo.
echo 🔧 CONFIGURADOR DE SERVICE ACCOUNT
echo ================================
echo.
echo 📋 Pasos para configurar:
echo.
echo 1. Ve a https://console.cloud.google.com
echo 2. Crea/selecciona proyecto
echo 3. Habilita Google Sheets API
echo 4. Crea Service Account
echo 5. Descarga archivo JSON
echo 6. Extrae client_email y private_key
echo 7. Actualiza archivo .env
echo 8. Comparte Google Sheet con el service account email
echo 9. Ejecuta: npm run test-sheets
echo.
echo 📄 Formato para .env:
echo GOOGLE_SHEETS_CLIENT_EMAIL=tu-service@proyecto.iam.gserviceaccount.com
echo GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave\n-----END PRIVATE KEY-----"
echo GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
echo.
pause