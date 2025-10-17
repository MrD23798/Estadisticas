import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import D3GroupedBarChart from './D3GroupedBarChart';
import CubeChart3D from './CubeChart3D';
import { ComparisonData } from '../types';

interface HybridComparisonChartProps {
  data: ComparisonData[];
  month: number;
  year: number;
  loading?: boolean;
  width?: number;
  height?: number;
  comparisonDependencies?: string[];
}

const HybridComparisonChart: React.FC<HybridComparisonChartProps> = ({
  data,
  month,
  year,
  loading = false,
  width = 1200,
  height = 800,
  comparisonDependencies = []
}) => {
  const [is3D, setIs3D] = useState(true); // Empezar en modo 3D

  const toggleView = () => {
    setIs3D(!is3D);
  };

  // Convertir ComparisonData a formato DependencyData para CubeChart3D
  const convertedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    console.log('Datos de comparación:', data); // Debug
    
    // Agrupar por dependencia y sumar valores
    const groupedData = data.reduce((acc, item) => {
      const key = item.dependency;
      if (!acc[key]) {
        acc[key] = { category: key, value: 0 };
      }
      acc[key].value += item.value;
      return acc;
    }, {} as Record<string, { category: string; value: number }>);

    const result = Object.values(groupedData);
    console.log('Datos convertidos para 3D:', result); // Debug
    
    return result;
  }, [data]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 relative p-6">
      {/* Título del gráfico */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">
          Gráfico de Comparación
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Comparación entre dependencias seleccionadas
        </p>
      </div>

      {/* Información de dependencias seleccionadas */}
      {comparisonDependencies.length > 0 && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Dependencias seleccionadas:
          </h4>
          <div className="flex flex-wrap gap-2">
            {comparisonDependencies.map((dep, index) => (
              <motion.span
                key={dep}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs border border-blue-200 dark:border-blue-700"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {dep}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Botón de alternancia */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleView}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm border
            ${is3D 
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600'
            }
          `}
        >
          {is3D ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Vista 2D
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2m0 0V5a2 2 0 012-2h14a2 2 0 012 2v4M5 9h14" />
              </svg>
              Vista 3D
            </>
          )}
        </button>
      </div>

      {/* Contenido de los gráficos */}
      <div className="relative" style={{ height: height - 40 }}>
        {is3D ? (
          <motion.div
            key="3d-comparison-chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {convertedData.length > 0 ? (
              <CubeChart3D 
                data={convertedData}
                title="Comparación 3D"
                selectedObjectType="TODOS"
                width={width - 48}
                height={height - 40}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                  <p className="text-slate-400 text-lg mb-2">No hay datos para mostrar en vista 3D</p>
                  <p className="text-slate-500 text-sm">Selecciona dependencias para comparar</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="2d-comparison-chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
          >
            <D3GroupedBarChart 
              data={data}
              month={month}
              year={year}
              loading={loading}
              width={width - 48}
              height={height - 40}
            />
          </motion.div>
        )}
      </div>

      {/* Indicador de vista actual */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className={`
          px-2 py-1 rounded text-xs font-medium
          ${is3D 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
            : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'
          }
        `}>
          {is3D ? '3D' : '2D'}
        </div>
      </div>
    </div>
  );
};

export default HybridComparisonChart;