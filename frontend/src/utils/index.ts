// Exportaciones desde la carpeta utils
export { default as diagnosticarAPI } from './diagnosticarAPI';

/**
 * Formatea un número para mostrar con separador de miles
 * @param value Valor numérico a formatear
 * @param decimals Número de decimales (por defecto 0)
 * @returns Cadena formateada
 */
export const formatNumber = (value: number, decimals = 0): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Convierte una cadena de texto a título (primera letra de cada palabra en mayúscula)
 * @param str Cadena a convertir
 * @returns Cadena convertida
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Genera un color aleatorio basado en un string (útil para gráficos)
 * @param str Cadena para generar el color
 * @returns Color en formato hexadecimal
 */
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

/**
 * Genera colores para un gráfico con buena separación visual
 * @param count Número de colores a generar
 * @returns Array de colores en formato hexadecimal
 */
export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395',
    '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300'
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Si necesitamos más colores que los base, generamos colores adicionales
  const colors = [...baseColors];
  
  for (let i = baseColors.length; i < count; i++) {
    colors.push(stringToColor(`color-${i}`));
  }
  
  return colors;
};