# Importación Masiva CSV → MySQL

Script automatizado para importar datos de estadísticas judiciales desde archivos CSV a la base de datos MySQL.

## 📋 Proceso

El script ejecuta dos fases automáticamente:

### Fase 1: Transformación CSV → JSON
- Lee todos los archivos `.csv` de `backend/data/csv/`
- Extrae información estructurada:
  - Contexto (dependencia, período, fecha)
  - Totales (expedientes existentes, recibidos, reingresados)
  - Tipos de caso con sus valores
- Genera archivos `.json` en `backend/data/json_dump/`

### Fase 2: Carga Masiva JSON → MySQL
- Lee todos los archivos `.json` generados
- Mapea los datos al modelo de la base de datos
- Inserta/actualiza registros en MySQL usando TypeORM
- Utiliza la lógica existente de `GoogleSheetsService`

## 🚀 Uso

### 1. Preparar archivos CSV

Coloca tus archivos CSV en la carpeta:
```
backend/data/csv/
```

Formato esperado del nombre de archivo:
```
ME_J02_SEC_1_202402_CONF - Inicios.csv
    ^   ^    ^     ^
    |   |    |     └─ Período (YYYYMM)
    |   |    └─────── Secretaría
    |   └──────────── Juzgado
    └──────────────── Materia Específica
```

### 2. Ejecutar el script

```bash
npm run import-csv
```

### 3. Verificar resultados

El script mostrará:
- ✅ Archivos CSV procesados exitosamente
- ❌ Archivos con errores
- 📊 Resumen de registros insertados/actualizados

Los archivos JSON generados quedan en:
```
backend/data/json_dump/
```

## 📊 Estructura CSV Esperada

El script busca:

1. **Fecha estadística**: Patrón `DD/MM/AAAA`
2. **Expedientes existentes**: Sección `I. EXPEDIENTES EXISTENTES`
3. **Expedientes recibidos**: Sección `II. EXPEDIENTES RECIBIDOS`
4. **Tipos de caso**: Filas dentro de la sección II con columnas:
   - Nombre del tipo de caso
   - Asignados
   - Reingresados

## 🔧 Configuración

### Rutas (modificables en el script)

```typescript
const CSV_FOLDER = path.join(__dirname, '../../data/csv');
const JSON_DUMP_FOLDER = path.join(__dirname, '../../data/json_dump');
```

### Mapeo de Dependencias

El script extrae el nombre de la dependencia del archivo:
- `J02_SEC_1` → `J2-S1`
- `J10_SEC_2` → `J10-S2`

Si necesitas personalizar este mapeo, edita la función `parseFileNameContext()`.

## 📝 Formato JSON Generado

```json
{
  "context": {
    "dependencia": "J2-S1",
    "periodo": "202402",
    "anio": 2024,
    "mes": 2,
    "fechaEstadistica": "2024-02-29"
  },
  "totals": {
    "expedientesExistentes": 6119,
    "expedientesRecibidos": 6358,
    "expedientesReingresados": 3
  },
  "caseTypes": [
    {
      "name": "1.Amparo por Mora de la Administración",
      "recibidosAsignados": 2,
      "reingresados": 0
    }
  ],
  "metadata": {
    "csvFileName": "ME_J02_SEC_1_202402_CONF - Inicios.csv",
    "importedAt": "2025-10-22T14:30:00.000Z"
  }
}
```

## ⚠️ Notas Importantes

1. **Duplicados**: El script actualiza registros existentes si encuentra el mismo `periodo` y `dependencia`.

2. **Transacciones**: Cada registro se guarda en una transacción separada, evitando que un error afecte a otros.

3. **Conexión BD**: El script se conecta automáticamente a MySQL usando la configuración de `.env`.

4. **Limpieza**: Los archivos JSON quedan guardados para auditoría. Puedes eliminarlos manualmente si lo deseas.

## 🐛 Solución de Problemas

### Error: "No se encontraron archivos CSV"
- Verifica que los archivos estén en `backend/data/csv/`
- Asegúrate que tengan extensión `.csv`

### Error: "No se pudo extraer periodo"
- Verifica que el nombre del archivo contenga el período en formato `YYYYMM`
- Ejemplo: `202402` para Febrero 2024

### Error de conexión a base de datos
- Verifica que el archivo `.env` tenga las credenciales correctas
- Asegúrate que MySQL esté corriendo
- Prueba la conexión con: `npm run dev`

## 📚 Dependencias

- `csv-parser`: Lectura de archivos CSV
- `typeorm`: ORM para MySQL
- `fs/path`: Manejo de archivos (Node.js nativo)

## 🎯 Ejemplo Completo

```bash
# 1. Coloca tus CSVs
cp mi_archivo.csv backend/data/csv/

# 2. Ejecuta la importación
npm run import-csv

# 3. Verifica en la base de datos
# Los datos estarán en las tablas:
# - dependencias
# - estadisticas
# - tipos_caso
# - estadisticas_tipo_caso
```

## 📞 Soporte

Si encuentras problemas, revisa:
1. Logs del script (muestra errores detallados)
2. Archivos JSON generados (verifica el parsing)
3. Estructura del CSV (comparar con el ejemplo)
