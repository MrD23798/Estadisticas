# Solución de Rate Limiting para Google Sheets API

## Problema

El sistema experimenta errores de tipo `429 Too Many Requests` al sincronizar datos desde Google Sheets API. Esto ocurre porque:

1. La API de Google Sheets tiene un límite de aproximadamente 60 solicitudes por minuto por usuario
2. El proceso de sincronización realiza múltiples solicitudes en rápida sucesión
3. No existía un manejo adecuado de los límites de tasa (rate limits)

Error típico recibido:
```
Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user' of service 'sheets.googleapis.com'
```

## Solución implementada

Se ha implementado un sistema de control de tasas (rate limiting) con retroceso exponencial (exponential backoff) en el servicio `GoogleSheetsService`:

### 1. Parámetros de control de tasa

```typescript
private rateLimitDelay = 1000; // Retraso inicial entre solicitudes (1 segundo)
private readonly MAX_RATE_LIMIT_DELAY = 60000; // Retraso máximo (1 minuto)
private requestsInLastMinute = 0; // Contador de solicitudes
private lastRequestTime = 0; // Tiempo de la última solicitud
private consecutiveRateLimitErrors = 0; // Errores consecutivos
```

### 2. Método controlado de solicitudes

Se implementó el método `controlledRequest<T>` que:

- Controla el número de solicitudes por minuto
- Espera automáticamente cuando se acerca al límite
- Implementa retroceso exponencial ante errores
- Reintentar automáticamente solicitudes fallidas por límite de cuota

```typescript
private async controlledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  // Código de control de tasas y reintentos
}
```

### 3. Proceso de retroceso exponencial

Cuando se detecta un error 429 (Too Many Requests):

1. Incrementa el contador de errores consecutivos
2. Aumenta exponencialmente el tiempo de espera entre solicitudes
   ```
   nuevoRetraso = retrasoActual * (2 ^ erroresConsecutivos)
   ```
3. Espera el nuevo tiempo de retraso
4. Reintenta la solicitud automáticamente

### 4. Auto-recuperación

Cuando las solicitudes vuelven a ser exitosas:

1. Restablece el contador de errores consecutivos
2. Reduce gradualmente el tiempo de espera entre solicitudes

### 5. Implementación en todos los puntos de API

Todas las llamadas a la API de Google Sheets ahora utilizan el método controlado:

- `listAvailableSheets()`
- `hasValidDataStructure()`
- `extractSheetData()`
- `readIndividualSpreadsheet()`
- `testConnection()`

## Beneficios

1. **Evita errores de cuota**: Controla proactivamente el número de solicitudes
2. **Resiliencia**: El sistema se recupera automáticamente de errores temporales
3. **Adaptiación dinámica**: Se ajusta según las condiciones de carga de la API
4. **Mejor experiencia**: Evita interrupciones completas del proceso de sincronización
5. **Logging mejorado**: Proporciona información clara sobre el estado de las solicitudes

## Recomendaciones adicionales

1. **Implementar caché**: Almacenar resultados frecuentes en caché para reducir llamadas a la API
2. **Sincronización programada**: Realizar sincronizaciones completas en horarios de baja demanda
3. **Sincronización incremental**: Implementar sincronización solo de datos nuevos o modificados
4. **Solicitar aumento de cuota**: Si es necesario, solicitar a Google un aumento de la cuota de API