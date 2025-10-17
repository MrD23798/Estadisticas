import React, { useState, useEffect } from 'react';
import { BarChart, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualizationFilters } from '../../types';
import DarkSelect from '../ui/DarkSelect';
import Chart from '../charts/Chart';
import { useDataService } from '../../hooks/useDataService';

interface VisualizationPanelProps {
  dependencies: string[];
  months: string[];
  years: string[];
  filters: VisualizationFilters;
  onFiltersChange: (filters: VisualizationFilters) => void;
  onGenerate: () => void;
  onReset: () => void;
  showChart?: boolean;
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  dependencies,
  months,
  years,
  filters,
  onFiltersChange,
  onGenerate,
  onReset,
  showChart = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  // Use data service hook
  const {
    chartData,
    isChartLoading,
    chartError,
    refreshChartData,
    syncData,
    syncStatus,
    isServiceReady
  } = useDataService();

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <motion.div 
      className="w-full lg:w-1/3"
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <motion.button
        onClick={toggleMenu}
        className="w-full glass-button font-semibold py-4 px-6 flex items-center justify-center"
        style={{ color: 'var(--text-primary)' }}
        whileHover={{ 
          scale: 1.03,
          transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
        }}
        whileTap={{ 
          scale: 0.97,
          transition: { duration: 0.1, ease: [0.34, 1.56, 0.64, 1] }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <BarChart className="mr-2" size={22} />
        </motion.div>
        Visualizar Gráfico
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ 
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <ChevronDown className="ml-2" size={22} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div 
            className="mt-4 glass-card"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Seleccionar Datos</h3>
              <motion.button 
                onClick={onReset}
                className="glass-button flex items-center text-sm px-3 py-2"
                style={{ color: 'var(--text-secondary)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={14} className="mr-1" />
                Restablecer
              </motion.button>
            </div>
            
            <div className="mb-4">
              <label className="block font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Dependencia</label>
              <DarkSelect
                value={filters.selectedDependency}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  selectedDependency: value
                })}
                options={[
                  { value: '', label: 'Seleccione una dependencia' },
                  ...dependencies.map(dep => ({ value: dep, label: dep }))
                ]}
                placeholder=""
                searchable={true}
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Mes</label>
              <DarkSelect
                value={filters.selectedMonth}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  selectedMonth: value
                })}
                options={[
                  { value: '', label: 'Seleccione un mes' },
                  ...months.map(month => ({ value: month, label: month }))
                ]}
                placeholder=""
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Año</label>
              <DarkSelect
                value={filters.selectedYear}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  selectedYear: value
                })}
                options={[
                  { value: '', label: 'Seleccione un año' },
                  ...years.map(year => ({ value: year, label: year }))
                ]}
                placeholder=""
              />
            </div>

            <motion.button 
              onClick={onGenerate}
              className={`w-full font-semibold py-3 px-4 transition-all mb-3 ${
                filters.selectedDependency && filters.selectedMonth && filters.selectedYear
                  ? 'glass-button' 
                  : 'glass-panel cursor-not-allowed opacity-50'
              }`}
              style={{ 
                color: filters.selectedDependency && filters.selectedMonth && filters.selectedYear 
                  ? 'var(--text-primary)' 
                  : 'var(--text-secondary)' 
              }}
              disabled={!filters.selectedDependency || !filters.selectedMonth || !filters.selectedYear}
              whileHover={filters.selectedDependency && filters.selectedMonth && filters.selectedYear ? { scale: 1.02 } : {}}
              whileTap={filters.selectedDependency && filters.selectedMonth && filters.selectedYear ? { scale: 0.98 } : {}}
            >
              Generar Estadísticas
            </motion.button>



            {/* Status indicators */}
            {chartError && (
              <div className="mb-3 p-2 rounded glass-panel border border-red-500/30">
                <p className="text-red-400 text-sm">{chartError}</p>
              </div>
            )}


          </motion.div>
        )}
      </AnimatePresence>


    </motion.div>
  );
};

export default VisualizationPanel;