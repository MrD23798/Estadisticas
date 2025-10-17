import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  csvAvailable: boolean | null;
}

const Header: React.FC<HeaderProps> = ({ csvAvailable }) => {
  return (
    <motion.header 
      className="mb-10 relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Botón de tema en la esquina superior derecha */}
      <div className="absolute top-0 right-0">
        <ThemeToggle />
      </div>
      
      {/* Contenido central */}
      <div className="text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-300 dark:to-indigo-400 mb-3">
          Estadísticas
        </h1>
        <p className="text-slate-600 dark:text-slate-300">Poder Judicial - Sistema de Visualización de Datos</p>
      </div>
      
      {csvAvailable === false && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
          
        </div>
      )}
    </motion.header>
  );
};

export default Header;