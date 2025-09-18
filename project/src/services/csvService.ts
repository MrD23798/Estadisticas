import Papa from 'papaparse';

// Interfaces para los datos
export interface DependencyData {
  category: string;
  value: number;
}

export interface ComparisonData {
  dependency: string;
  category: string;
  value: number;
}

export interface EvolutionData {
  period: string;
  value: number;
  year: string;
  month: string;
}

// Interface para los datos del CSV original
interface CSVRow {
  Dependencia: string;
  Codigo: string;
  CodObjeto: string;
  Naturaleza: string;
  Objeto: string;
  Período?: string; // Con acento (archivos antiguos)
  Periodo?: string; // Sin acento (archivos más recientes)
  cantidad?: string; // Minúscula en archivos más recientes
  Cantidad?: string; // Mayúscula en archivos más antiguos
  'Objeto-Desc - Tipo_Expte': string;
}

/**
 * Encuentra el archivo CSV correcto para el período dado
 */
const findCorrectCSVFile = async (year: number, month: number): Promise<string | null> => {
  const monthStr = month.toString().padStart(2, '0');
  const baseFileName = `Datos ${year}${monthStr}`;
  
  // Posibles variaciones de nombres de archivos (más completas)
  const fileVariants = [
    `${baseFileName} - Hoja1.csv`,
    `${baseFileName} - Hoja 1.csv`,
    `${baseFileName} - Sheet1.csv`,
    `${baseFileName} - Sheet 1.csv`,
    `${baseFileName} - Hoja1 .csv`,
    `${baseFileName} -Hoja1.csv`,
    `${baseFileName}- Hoja1.csv`,
    `${baseFileName}.csv`
  ];

  for (const fileName of fileVariants) {
    try {
      const response = await fetch(`/data/${fileName}`);
      if (response.ok) {
        console.log(`✓ Found CSV file: ${fileName}`);
        return fileName;
      }
    } catch (error) {
      // Continue to next variant
    }
  }
  
  console.log(`✗ No CSV file found for ${year}-${monthStr}`);
  return null;
};

/**
 * Carga y parsea un archivo CSV
 */
const loadCSV = async (filePath: string): Promise<CSVRow[]> => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Error al cargar el archivo: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        skipFirstNLines: 0,
        transformHeader: (header) => header.trim(),
        transform: (value) => value?.trim() || '',
        dynamicTyping: false,
        fastMode: false,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Errores al parsear CSV:', results.errors);
            console.warn('Detalles de errores:');
            results.errors.forEach(error => {
              console.warn(`- Fila ${error.row}: ${error.message}`, error);
            });
          }
          console.log('Primeras 3 filas parseadas:', results.data.slice(0, 3));
          resolve(results.data as CSVRow[]);
        },
        error: (error: unknown) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error al cargar CSV:', error);
    throw error;
  }
};

/**
 * Convierte el período YYYYMM a formato legible
 */
const formatPeriod = (period: string): { month: string; year: string } => {
  if (period.length !== 6) {
    return { month: '', year: '' };
  }
  
  const year = period.substring(0, 4);
  const monthNum = parseInt(period.substring(4, 6));
  
  const months = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return {
    month: months[monthNum] || '',
    year: year
  };
};

/**
 * Convierte mes y año a formato de período YYYYMM
 */
const toPeriodFormat = (month: string, year: string): string => {
  const months: { [key: string]: string } = {
    'Enero': '01', 'Febrero': '02', 'Marzo': '03', 'Abril': '04',
    'Mayo': '05', 'Junio': '06', 'Julio': '07', 'Agosto': '08',
    'Septiembre': '09', 'Octubre': '10', 'Noviembre': '11', 'Diciembre': '12'
  };
  
  const monthNum = months[month];
  if (!monthNum) return '';
  
  return `${year}${monthNum}`;
};

/**
 * Obtiene la cantidad de un registro CSV, manejando diferentes nombres de columna
 */
const getCantidad = (row: CSVRow): number => {
  let cantidad = 0;
  
  // Intentar primero con minúscula (archivos más recientes)
  if (row.cantidad !== undefined) {
    cantidad = parseInt(row.cantidad) || 0;
  }
  // Si no existe, probar con mayúscula (archivos más antiguos)
  else if (row.Cantidad !== undefined) {
    cantidad = parseInt(row.Cantidad) || 0;
  }
  
  // Debug: mostrar información sobre la cantidad encontrada
  if (cantidad > 0) {
    console.log(`Cantidad encontrada: ${cantidad} para objeto: ${row.Objeto}`);
  } else {
    console.log(`Cantidad 0 para fila:`, row);
  }
  
  return cantidad;
};

/**
 * Obtiene el período de un registro CSV, manejando diferentes nombres de columna
 */
const getPeriodo = (row: CSVRow): string => {
  // Intentar primero con acento (archivos antiguos)
  if (row.Período !== undefined) {
    return row.Período;
  }
  // Si no existe, probar sin acento (archivos más recientes)
  if (row.Periodo !== undefined) {
    return row.Periodo;
  }
  // Si ninguno existe, devolver string vacío
  return '';
};

/**
 * Obtiene datos de estadísticas para una dependencia específica
 */
export const fetchDependencyStats = async (
  dependency: string,
  month: string,
  year: string
): Promise<DependencyData[]> => {
  console.log('🔍 fetchDependencyStats llamada con:', { dependency, month, year });
  
  try {
    const targetPeriod = toPeriodFormat(month, year);
    console.log('📅 Período objetivo:', targetPeriod);
    
    if (!targetPeriod) {
      throw new Error(`Período inválido: ${month} ${year}`);
    }

    // Buscar el archivo correcto para el período
    const targetPeriodNum = parseInt(targetPeriod);
    const periodYear = Math.floor(targetPeriodNum / 100);
    const periodMonth = targetPeriodNum % 100;
    const correctFileName = await findCorrectCSVFile(periodYear, periodMonth);
    console.log(`Archivo encontrado para ${targetPeriod}: ${correctFileName}`);
    
    const data = await loadCSV(`/data/${correctFileName}`);
    console.log(`Total de registros cargados: ${data.length}`);
    
    // Filtrar datos por dependencia y período
    const filteredData = data.filter(row => 
      row.Dependencia && 
      row.Dependencia.trim() === dependency.trim() && 
      getPeriodo(row) === targetPeriod
    );
    
    console.log(`Registros filtrados para ${dependency} en ${targetPeriod}: ${filteredData.length}`);
    console.log('Primeros 3 registros filtrados:', filteredData.slice(0, 3));
    
    if (filteredData.length === 0) {
      throw new Error(`No se encontraron datos para ${dependency} en ${month} ${year}`);
    }
    
    // Agrupar por objeto/categoría y sumar cantidades
    const groupedData: { [key: string]: number } = {};
    
    filteredData.forEach(row => {
      const category = row.Objeto || 'Sin categoría';
      const cantidad = getCantidad(row);
      
      if (groupedData[category]) {
        groupedData[category] += cantidad;
      } else {
        groupedData[category] = cantidad;
      }
    });
    
    console.log('Datos agrupados:', groupedData);
    
    // Convertir a formato esperado
    const result: DependencyData[] = Object.entries(groupedData)
      .map(([category, value]) => ({
        category,
        value
      }))
      .sort((a, b) => b.value - a.value) // Ordenar por cantidad descendente
      .slice(0, 10); // Tomar solo los 10 primeros
    
    console.log('Resultado final:', result);
    return result;
  } catch (error) {
    console.error('Error al obtener datos de dependencia:', error);
    // No retornar datos de ejemplo, solo array vacío
    return [];
  }
};

/**
 * Obtiene datos para comparar múltiples dependencias
 */
export const fetchComparisonStats = async (
  dependencies: string[],
  month: string,
  year: string
): Promise<ComparisonData[]> => {
  try {
    const targetPeriod = toPeriodFormat(month, year);
    
    if (!targetPeriod) {
      throw new Error(`Período inválido: ${month} ${year}`);
    }

    // Buscar el archivo correcto para el período
    const targetPeriodNum = parseInt(targetPeriod);
    const periodYear = Math.floor(targetPeriodNum / 100);
    const periodMonth = targetPeriodNum % 100;
    const correctFileName = await findCorrectCSVFile(periodYear, periodMonth);
    const data = await loadCSV(`/data/${correctFileName}`);
    
    const result: ComparisonData[] = [];
    for (const dependency of dependencies) {
      // Filtrar datos por dependencia y período
      const filteredData = data.filter(row =>
        row.Dependencia && 
        row.Dependencia.trim() === dependency.trim() &&
        getPeriodo(row) === targetPeriod
      );
      // Agrupar por categoría y sumar cantidades
      const grouped: { [key: string]: number } = {};
      filteredData.forEach(row => {
        const category = row.Objeto || 'Sin categoría';
        const cantidad = getCantidad(row);
        if (grouped[category]) {
          grouped[category] += cantidad;
        } else {
          grouped[category] = cantidad;
        }
      });
      Object.entries(grouped).forEach(([category, value]) => {
        result.push({
          dependency,
          category,
          value
        });
      });
    }
    return result;
  } catch (error) {
    console.error('Error al obtener datos de comparación:', error);
    // No retornar datos de ejemplo, solo array vacío
    return [];
  }
};

/**
 * Obtiene la lista de dependencias disponibles
 */
export const fetchDependencies = async (): Promise<string[]> => {
  try {
    // Lista más amplia de períodos para obtener todas las dependencias posibles
    const testPeriods = [
      '201409', '201408', '201407', '201406', '201405', '201404', '201403', '201402',
      '201309', '201308', '201307', '201306', '201305', '201304', '201303', '201302',
      '201209', '201208', '201207', '201206', '201205', '201204', '201203', '201202',
      '200502', '200503', '200504' // Períodos más antiguos también
    ];
    
    const allDependencies = new Set<string>();
    let successfulLoads = 0;
    
    // Intentar cargar datos de múltiples archivos para obtener todas las dependencias
    for (const period of testPeriods) {
      try {
        const periodNum = parseInt(period.toString());
        const periodYear = Math.floor(periodNum / 100);
        const periodMonth = periodNum % 100;
        const correctFileName = await findCorrectCSVFile(periodYear, periodMonth);
        const data = await loadCSV(`/data/${correctFileName}`);
        
        if (data.length > 0) {
          // Agregar todas las dependencias únicas de este archivo
          data.forEach(row => {
            if (row.Dependencia && typeof row.Dependencia === 'string' && row.Dependencia.trim()) {
              allDependencies.add(row.Dependencia.trim());
            }
          });
          successfulLoads++;
          console.log(`Cargado ${period}: ${data.length} registros, ${allDependencies.size} dependencias únicas hasta ahora`);
          
          // Si ya tenemos suficientes dependencias de varios archivos, podemos parar
          if (successfulLoads >= 5 && allDependencies.size > 10) {
            break;
          }
        }
      } catch (error) {
        console.warn(`No se pudo cargar período ${period}:`, error);
        continue;
      }
    }
    
    if (allDependencies.size === 0) {
      console.log('No se encontraron dependencias en ningún archivo');
    }
    
    // Convertir Set a Array y ordenar
    const uniqueDependencies = Array.from(allDependencies)
      .filter(dep => dep && dep.length > 0)
      .sort();
    
    console.log(`Total de dependencias encontradas: ${uniqueDependencies.length}`, uniqueDependencies);
    return uniqueDependencies;
  } catch (error) {
    console.error('Error al obtener lista de dependencias:', error);
    // Retornar una lista básica para que la app no falle completamente
    return [
      'CAMARA FEDERAL DE LA SEGURIDAD SOCIAL - SALA 1-',
      'CAMARA FEDERAL DE LA SEGURIDAD SOCIAL - SALA 2-', 
      'CAMARA FEDERAL DE LA SEGURIDAD SOCIAL - SALA 3-'
    ];
  }
};

/**
 * Obtiene la lista de períodos disponibles
 */
export const fetchAvailablePeriods = async (csvFile: string): Promise<{ month: string; year: string }[]> => {
  try {
    const data = await loadCSV(`/data/${csvFile}`);
    
    // Obtener períodos únicos y convertirlos a formato legible
    const uniquePeriods = [...new Set(data.map(row => getPeriodo(row)))]
      .filter(period => period && period.length === 6)
      .map(period => formatPeriod(period))
      .filter(period => period.month && period.year)
      .sort((a, b) => {
        if (a.year !== b.year) {
          return parseInt(b.year) - parseInt(a.year); // Años más recientes primero
        }
        const months = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months.indexOf(b.month) - months.indexOf(a.month); // Meses más recientes primero
      });
    
    return uniquePeriods;
  } catch (error) {
    console.error('Error al obtener períodos disponibles:', error);
    return [];
  }
};

/**
 * Verifica si los archivos CSV están disponibles
 */
export const checkCSVAvailability = async (csvFile: string): Promise<boolean> => {
  try {
    const response = await fetch(`/data/${csvFile}`);
    return response.ok;
  } catch (error) {
    console.error('Error al verificar disponibilidad de CSV:', error);
    return false;
  }
};

/**
 * Obtiene estadísticas generales del archivo CSV
 */
export const getCSVStats = async (csvFile: string): Promise<{
  totalRecords: number;
  dependencies: number;
  periods: number;
  lastUpdate: string;
}> => {
  try {
    const data = await loadCSV(`/data/${csvFile}`);
    const uniqueDependencies = new Set(data.map(row => row.Dependencia.trim()));
    const uniquePeriods = new Set(data.map(row => row.Período));
    
    return {
      totalRecords: data.length,
      dependencies: uniqueDependencies.size,
      periods: uniquePeriods.size,
      lastUpdate: new Date().toLocaleDateString('es-ES')
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del CSV:', error);
    return {
      totalRecords: 0,
      dependencies: 0,
      periods: 0,
      lastUpdate: 'No disponible'
    };
  }
};

/**
 * Obtiene datos de evolución para una dependencia específica en un rango de períodos
 */
export const fetchEvolutionStats = async (
  dependency: string,
  startMonth: string,
  endMonth: string,
  year: string,
  objectType?: string
): Promise<EvolutionData[]> => {
  try {
    console.log('🔍 fetchEvolutionStats llamada con:', { 
      dependency, 
      startMonth, 
      endMonth, 
      year, 
      objectType 
    });
    
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const startMonthIndex = months.indexOf(startMonth);
    const endMonthIndex = months.indexOf(endMonth);
    
    if (startMonthIndex === -1 || endMonthIndex === -1) {
      throw new Error('Mes inválido');
    }
    
    if (startMonthIndex > endMonthIndex) {
      throw new Error('El mes de inicio debe ser anterior al mes final');
    }
    
    const result: EvolutionData[] = [];
    
    for (let i = startMonthIndex; i <= endMonthIndex; i++) {
      const month = months[i];
      const monthNum = (i + 1).toString().padStart(2, '0');
      const period = `${year}${monthNum}`;
      
      try {
        // Buscar el archivo correcto para el período
        const periodNum = parseInt(period.toString());
        const periodYear = Math.floor(periodNum / 100);
        const periodMonth = periodNum % 100;
        
        console.log(`📅 Procesando ${month} ${year} (período: ${period})`);
        
        const correctFileName = await findCorrectCSVFile(periodYear, periodMonth);
        if (!correctFileName) {
          console.warn(`❌ No se encontró archivo para ${month} ${year}`);
          throw new Error(`Archivo no encontrado para ${period}`);
        }
        
        console.log(`📁 Cargando archivo: ${correctFileName}`);
        const data = await loadCSV(`/data/${correctFileName}`);
        console.log(`📊 Total registros cargados: ${data.length}`);
        
        // Filtrar datos por dependencia y período
        let filteredData = data.filter(row => 
          row.Dependencia &&
          row.Dependencia.trim() === dependency.trim() && 
          getPeriodo(row) === period
        );
        
        console.log(`🏛️ Registros filtrados por dependencia "${dependency}": ${filteredData.length}`);
        
        // Si se especifica un tipo de objeto, filtrar también por eso
        if (objectType && objectType !== 'TODOS') {
          filteredData = filteredData.filter(row => 
            row.Objeto && row.Objeto.trim() === objectType.trim()
          );
          console.log(`📝 Registros filtrados por objeto "${objectType}": ${filteredData.length}`);
        }
        
        // Sumar todas las cantidades para este período
        const totalValue = filteredData.reduce((sum, row) => {
          return sum + getCantidad(row);
        }, 0);
        
        console.log(`💯 Valor total para ${month} ${year}: ${totalValue}`);
        
        result.push({
          period,
          value: totalValue,
          year,
          month: month
        });
      } catch (error) {
        console.warn(`No se pudo cargar datos para ${month} ${year}:`, error);
        // Agregar valor 0 si no hay datos disponibles
        result.push({
          period,
          value: 0,
          year,
          month: month
        });
      }
    }
    
    console.log('🎯 Resultado final de evolución:', result);
    return result;
  } catch (error) {
    console.error('Error al obtener datos de evolución:', error);
    return [];
  }
};

/**
 * Obtiene lista de archivos CSV disponibles en el directorio data
 */
export const getAvailableCSVFiles = (): string[] => {
  // Lista de archivos CSV que deberían estar disponibles
  const files: string[] = [];
  const currentYear = new Date().getFullYear();
  
  for (let year = 2005; year <= currentYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const fileName = `Datos ${year}${monthStr} - Hoja1.csv`;
      files.push(fileName);
    }
  }
  
  return files;
};

/**
 * Obtiene los tipos de objetos disponibles para una dependencia específica
 */
export const fetchObjectTypes = async (
  dependency: string
): Promise<string[]> => {
  try {
    console.log(`🔍 Obteniendo tipos de objeto para: ${dependency}`);
    
    // Lista de períodos para buscar datos de la dependencia
    const testPeriods = [
      { year: 2014, month: 8 }, { year: 2014, month: 9 }, { year: 2014, month: 7 },
      { year: 2013, month: 8 }, { year: 2013, month: 9 }, { year: 2012, month: 8 }
    ];
    
    const allObjects = new Set<string>();
    
    // Intentar cargar datos de múltiples archivos
    for (const { year, month } of testPeriods) {
      try {
        const correctFileName = await findCorrectCSVFile(year, month);
        if (!correctFileName) continue;
        
        const data = await loadCSV(`/data/${correctFileName}`);
        
        // Filtrar datos por dependencia y obtener objetos únicos
        const filteredData = data.filter(row => 
          row.Dependencia && 
          row.Dependencia.trim() === dependency.trim()
        );
        
        filteredData.forEach(row => {
          if (row.Objeto && typeof row.Objeto === 'string' && row.Objeto.trim()) {
            allObjects.add(row.Objeto.trim());
          }
        });
        
        console.log(`📄 Archivo ${year}${month.toString().padStart(2, '0')}: ${filteredData.length} registros de la dependencia, ${allObjects.size} tipos únicos`);
        
        // Si ya tenemos suficientes tipos, podemos parar
        if (allObjects.size > 10) break;
        
      } catch (error) {
        console.log(`⚠️ No se pudo cargar ${year}${month.toString().padStart(2, '0')}`);
      }
    }
    
    const uniqueObjects = Array.from(allObjects).sort();
    console.log(`✅ Tipos de objeto encontrados para ${dependency}:`, uniqueObjects);
    
    // Agregar opción "TODOS" al principio
    return ['TODOS', ...uniqueObjects];
  } catch (error) {
    console.error('Error al obtener tipos de objetos:', error);
    return ['TODOS'];
  }
};