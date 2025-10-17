# Script para probar la sincronización con Google Sheets
Write-Host "Probando endpoint de sincronización..." -ForegroundColor Green

try {
    $body = @{
        forzar = $false
        eliminarExistentes = $false
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/estadisticas/sync" -Method POST -ContentType "application/json" -Body $body

    Write-Host "Respuesta de sincronización:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5 | Write-Host
}
catch {
    Write-Host "Error al sincronizar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}