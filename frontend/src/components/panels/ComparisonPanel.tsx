import React, { useState } from 'react';
import { LineChart, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComparisonFilters } from '../../types';
import DarkSelect from '../ui/DarkSelect';

interface ComparisonPanelProps {
  dependencies: string[];
  months: string[];
  years: string[];
  filters: ComparisonFilters;
  onFiltersChange: (filters: ComparisonFilters) => void;
  onGenerate: () => void;
  onReset: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
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

  const handleDependencyToggle = (dependency: string) => {
    const newDependencies = filters.comparisonDependencies.includes(dependency)
      ? filters.comparisonDependencies.filter(dep => dep !== dependency)
      : filters.comparisonDependencies.length < 5 
        ? [...filters.comparisonDependencies, dependency]
        : filters.comparisonDependencies;
    
    onFiltersChange({
      ...filters,
      comparisonDependencies: newDependencies
    });
  };

  return (
    <motion.div 
      className="w-full lg:w-1/3"
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <motion.button 
        onClick={toggleMenu}
        className="w-full glass-button font-semibold py-4 px-6 flex items-center justify-center"
        style={{ color: 'var(--text-primary)' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <LineChart className="mr-2" size={22} />
        Realizar Comparativa
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
              <h3 className="font-semibold text-slate-800 dark:text-gray-100">Configurar Comparativa</h3>
              <motion.button 
                onClick={onReset}
                className="glass-button flex items-center text-sm px-3 py-2"
                style={{ color: 'var(--text-primary)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={14} className="mr-1" />
                Restablecer
              </motion.button>
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                Dependencias a comparar (Máximo 5) - {filters.comparisonDependencies.length} seleccionadas
              </label>
              <div className="max-h-40 overflow-y-auto bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-slate-300 dark:border-slate-700">
                {dependencies.map(dep => (
                  <motion.label 
                    key={dep}
                    className="flex items-center mb-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/50 p-1 rounded transition-colors"
                    whileHover={{ scale: 1.01 }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.comparisonDependencies.includes(dep)}
                      onChange={() => handleDependencyToggle(dep)}
                      disabled={!filters.comparisonDependencies.includes(dep) && filters.comparisonDependencies.length >= 5}
                      className="mr-2 text-indigo-500 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500"
                    />
                    <span className={`text-sm ${
                      filters.comparisonDependencies.includes(dep) 
                        ? 'text-indigo-600 dark:text-indigo-300 font-medium' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {dep}
                    </span>
                  </motion.label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Mes</label>
              <DarkSelect
                value={filters.comparisonMonth}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  comparisonMonth: value
                })}
                options={[
                  { value: '', label: 'Seleccione un mes' },
                  ...months.map(month => ({ value: month, label: month }))
                ]}
                placeholder=""
                className="focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Año</label>
              <DarkSelect
                value={filters.comparisonYear}
                onChange={(value) => onFiltersChange({
                  ...filters,
                  comparisonYear: value
                })}
                options={[
                  { value: '', label: 'Seleccione un año' },
                  ...years.map(year => ({ value: year, label: year }))
                ]}
                placeholder=""
                className="focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>

            <motion.button 
              onClick={onGenerate}
              className={`w-full font-semibold py-3 px-4 transition-all mb-3 ${
                filters.comparisonDependencies.length > 0 && filters.comparisonMonth && filters.comparisonYear
                  ? 'glass-button' 
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed rounded-lg'
              }`}
              style={filters.comparisonDependencies.length > 0 && filters.comparisonMonth && filters.comparisonYear ? { color: 'var(--text-primary)' } : {}}
              disabled={filters.comparisonDependencies.length === 0 || !filters.comparisonMonth || !filters.comparisonYear}
              whileHover={filters.comparisonDependencies.length > 0 && filters.comparisonMonth && filters.comparisonYear ? { scale: 1.02 } : {}}
              whileTap={filters.comparisonDependencies.length > 0 && filters.comparisonMonth && filters.comparisonYear ? { scale: 0.98 } : {}}
            >
              Generar Comparativa
            </motion.button>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ComparisonPanel;