# Sincronización Incremental de Google Sheets

## Descripción

Este documento explica cómo funciona el sistema de sincronización incremental para agregar nuevos datos desde Google Sheets a la base de datos.

## Características

1. **Sincronización de hojas individuales**: Permite agregar una nueva hoja de Google Sheets a la base de datos sin necesidad de ejecutar una sincronización completa.

2. **Verificación de duplicados**: El sistema verifica automáticamente si una hoja ya ha sido sincronizada para evitar duplicados.

3. **Control de errores**: Implementa manejo de excepciones y mensajes de error descriptivos.

4. **Integración con frontend**: Incluye una interfaz de usuario para agregar nuevas hojas de forma sencilla.

## API Endpoints

### 1. Sincronizar una hoja individual

```
POST /api/v1/sync/sheet
```

**Parámetros (JSON):**
```json
{
  "sheetId": "1AHi-ksvNFvRatDXsR607nKCS2V8v7FNbQJJW035PPig",
  "periodo": "202410",
  "dependencia": "JUZGADO FEDERAL DE MENDOZA"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Hoja sincronizada correctamente",
  "sheetId": "1AHi-ksvNFvRatDXsR607nKCS2V8v7FNbQJJW035PPig",
  "registrosInsertados": 1
}
```

### 2. Verificar estado de una hoja

```
GET /api/v1/sync/sheet/{sheetId}/status
```

**Respuesta:**
```json
{
  "success": true,
  "sheetId": "1AHi-ksvNFvRatDXsR607nKCS2V8v7FNbQJJW035PPig",
  "isSynced": false,
  "message": "La hoja no está sincronizada en la base de datos"
}
```

## Frontend

El frontend incluye un componente `SyncIndividualSheet` que proporciona una interfaz para:

1. Ingresar el ID de una hoja de Google Sheets
2. Verificar si ya está sincronizada
3. Especificar el periodo y la dependencia
4. Sincronizar los datos de la hoja

Este componente está disponible en la página de sincronización en `/sync`.

## Flujo del proceso

1. El usuario ingresa el ID de la hoja de Google Sheets
2. El sistema verifica si la hoja ya está sincronizada
3. El usuario completa el periodo y la dependencia
4. Al enviar el formulario, el sistema:
   - Conecta con Google Sheets API (con control de tasas)
   - Lee los datos de la hoja especificada
   - Procesa y transforma los datos
   - Guarda los datos en la base de datos
5. Se muestra un mensaje de éxito o error

## Diagrama de flujo

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Ingresar ID │ ──► │ Verificar si ya │ ──► │ Ingresar periodo │
└─────────────┘     │ existe en la DB │     │ y dependencia    │
                    └─────────────────┘     └──────────────────┘
                                                      │
┌────────────────┐     ┌─────────────────┐           ▼
│ Guardar en DB  │ ◄── │ Procesar datos  │ ◄── ┌──────────────┐
└────────────────┘     └─────────────────┘     │ Obtener datos │
                                               │ de Google API │
                                               └──────────────┘
```

## Consideraciones importantes

1. **Dependencia**: Asegúrese de usar el nombre exacto de la dependencia como aparece en la base de datos.

2. **Formato de periodo**: El periodo debe estar en formato YYYYMM (ejemplo: 202410 para Octubre 2024).

3. **ID de hoja**: El ID de la hoja es la parte final de la URL de Google Sheets:
   ```
   https://docs.google.com/spreadsheets/d/1AHi-ksvNFvRatDXsR607nKCS2V8v7FNbQJJW035PPig/edit#gid=0
                                         └─────────────────────────────────────────────┘
                                                           SheetId
   ```

4. **Rate limiting**: El sistema utiliza control de tasas para evitar errores por exceso de solicitudes a la API de Google.