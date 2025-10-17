import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import D3BarChart from './D3BarChart';
import CubeChart3D from './CubeChart3D';
import { DependencyData } from '../types';

interface HybridChartProps {
  data: DependencyData[];
  dependency?: string;
  month?: string;
  year?: string;
  title?: string;
  selectedObjectType?: string;
  width?: number;
  height?: number;
  loading?: boolean;
}

const HybridChart: React.FC<HybridChartProps> = ({
  data,
  dependency = "CAMARA FEDERAL DE LA SEGURIDAD SOCIAL - SALA 1",
  month = "Febrero",
  year = "2005",
  title = "Estadísticas por Dependencia",
  selectedObjectType = "TODOS",
  width = 1000,
  height = 700,
  loading = false
}) => {
  const [is3D, setIs3D] = useState(false);

  const toggleView = () => {
    setIs3D(!is3D);
  };

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 relative">
      {/* Botón de alternancia */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleView}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
            ${is3D 
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
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
      <AnimatePresence mode="wait">
        {is3D ? (
          <motion.div
            key="3d-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ minHeight: height }}
          >
            <CubeChart3D 
              data={data}
              title={title.replace('Estadísticas', 'Visualización 3D')}
              selectedObjectType={selectedObjectType}
              width={width}
              height={height}
            />
          </motion.div>
        ) : (
          <motion.div
            key="2d-chart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ minHeight: height }}
          >
            <D3BarChart 
              data={data}
              dependency={dependency}
              month={month}
              year={year}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de vista actual */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${is3D 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
          }
        `}>
          {is3D ? '3D' : '2D'}
        </div>
      </div>
    </div>
  );
};

export default HybridChart;