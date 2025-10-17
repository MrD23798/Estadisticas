import React from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';

interface HeaderProps {
  apiAvailable: boolean | null;
}

const Header: React.FC<HeaderProps> = ({ apiAvailable }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94], // iOS-like easing
        staggerChildren: 0.15,
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card mb-8 relative overflow-hidden"
    >
      <motion.div 
        className="absolute top-4 right-4"
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.3,
          ease: [0.34, 1.56, 0.64, 1] // iOS spring
        }}
      >
        <ThemeToggle />
      </motion.div>
      
      <div className="pr-16">
        <motion.h1 
          variants={itemVariants}
          className="text-4xl font-bold mb-2 text-center" 
          style={{ color: 'var(--text-primary)' }}
        >
          Estadísticas
        </motion.h1>
        
        <motion.div
          variants={itemVariants}
          className="text-center mb-6"
        >
          <motion.h2 
            className="text-xl font-medium relative inline-block tracking-wide"
            style={{ 
              color: 'var(--text-secondary)',
              letterSpacing: '0.1em'
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
          >
            Poder Judicial
            <motion.div
              className="absolute bottom-0 left-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, var(--text-secondary) 50%, transparent 100%)'
              }}
              initial={{ 
                width: 0,
                opacity: 0
              }}
              animate={{ 
                width: "100%",
                opacity: 0.4
              }}
              transition={{
                width: { 
                  duration: 1.8, 
                  delay: 1, 
                  ease: [0.23, 1, 0.32, 1]
                },
                opacity: {
                  duration: 1.2,
                  delay: 1.5,
                  ease: "easeOut"
                }
              }}
              whileHover={{
                opacity: 0.7,
                transition: { duration: 0.3 }
              }}
            />
          </motion.h2>
        </motion.div>
        <motion.p 
          variants={itemVariants}
          className="text-lg mb-4 text-center" 
          style={{ color: 'var(--text-secondary)' }}
        >
          Sistema de Visualización de Datos
        </motion.p>
        
        {apiAvailable === false && (
          <motion.div 
            variants={itemVariants}
            className="glass-panel p-4 rounded-lg"
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              API no disponible. Algunas funciones podrían estar limitadas.
            </p>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;