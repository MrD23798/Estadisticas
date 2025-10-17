import React, { useState } from 'react';
import { motion } from 'framer-motion';
import D3LineChart from './D3LineChart';
import EvolutionThree from './EvolutionThree';
import { EvolutionData } from './D3LineChart';

interface HybridEvolutionChartProps {
  data: EvolutionData[];
  dependency: string;
  startPeriod: string;
  endPeriod: string;
  year: string;
  objectType?: string;
  loading: boolean;
  width?: number;
  height?: number;
}

const HybridEvolutionChart: React.FC<HybridEvolutionChartProps> = ({
  data,
  dependency,
  startPeriod,
  endPeriod,
  year,
  objectType = 'TODOS',
  loading,
  width = 1200,
  height = 600
}) => {
  const [is3D, setIs3D] = useState(true); // Empezar en modo 3D como solicitado

  const toggleView = () => {
    setIs3D(!is3D);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 relative p-6">
      {/* Título del gráfico */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">
          Evolución Temporal
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          {dependency} - Período {startPeriod} a {endPeriod} de {year}
          {objectType !== 'TODOS' && ` - ${objectType}`}
        </p>
      </div>

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
            key="3d-evolution-chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <EvolutionThree 
              data={data}
              dependency={dependency}
              startPeriod={startPeriod}
              endPeriod={endPeriod}
              year={year}
              objectType={objectType}
              loading={loading}
              width={width - 48}
              height={height - 40}
              title="Evolución Temporal 3D con Three.js"
            />
          </motion.div>
        ) : (
          <motion.div
            key="2d-evolution-chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full bg-white dark:bg-slate-800 rounded-lg overflow-hidden"
          >
            <D3LineChart 
              data={data}
              dependency={dependency}
              startPeriod={startPeriod}
              endPeriod={endPeriod}
              year={year}
              objectType={objectType}
              loading={loading}
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

export default HybridEvolutionChart;