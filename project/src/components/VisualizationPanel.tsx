import React, { useState } from 'react';
import { BarChart, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualizationFilters } from '../types';

interface VisualizationPanelProps {
  dependencies: string[];
  months: string[];
  years: string[];
  filters: VisualizationFilters;
  onFiltersChange: (filters: VisualizationFilters) => void;
  onGenerate: () => void;
  onReset: () => void;
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  dependencies,
  months,
  years,
  filters,
  onFiltersChange,
  onGenerate,
  onReset
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <motion.div 
      className="w-full lg:w-1/3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.button 
        onClick={toggleMenu}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 dark:from-blue-500 dark:to-blue-700 dark:hover:from-blue-600 dark:hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/20"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <BarChart className="mr-2" size={22} />
        Visualizar Gráfico
        <motion.div
          animate={{ rotate: showMenu ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="ml-2" size={22} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <motion.div 
            className="mt-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-gray-100">Seleccionar Datos</h3>
              <motion.button 
                onClick={onReset}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={14} className="mr-1" />
                Restablecer
              </motion.button>
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Dependencia</label>
              <select 
                value={filters.selectedDependency}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  selectedDependency: e.target.value
                })}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              >
                <option value="">Seleccione una dependencia</option>
                {dependencies.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mes</label>
              <select 
                value={filters.selectedMonth}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  selectedMonth: e.target.value
                })}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              >
                <option value="">Seleccione un mes</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Año</label>
              <select 
                value={filters.selectedYear}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  selectedYear: e.target.value
                })}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              >
                <option value="">Seleccione un año</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <motion.button 
              onClick={onGenerate}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-all ${
                filters.selectedDependency && filters.selectedMonth && filters.selectedYear
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white shadow-lg' 
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
              disabled={!filters.selectedDependency || !filters.selectedMonth || !filters.selectedYear}
              whileHover={filters.selectedDependency && filters.selectedMonth && filters.selectedYear ? { scale: 1.02 } : {}}
              whileTap={filters.selectedDependency && filters.selectedMonth && filters.selectedYear ? { scale: 0.98 } : {}}
            >
              Generar Estadísticas
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VisualizationPanel;