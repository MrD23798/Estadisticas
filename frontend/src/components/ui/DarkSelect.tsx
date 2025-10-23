import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

interface DarkSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  // Filtrar opciones basado en el término de búsqueda
  useEffect(() => {
    if (searchable && searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, searchable]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar input de búsqueda cuando se abre
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(option => option.value === value);

  const handleOptionSelect = (optionValue: string) => {
    console.log('🔍 DarkSelect - Opción seleccionada:', optionValue);
    console.log('🔍 DarkSelect - Valor actual:', value);
    
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={selectRef}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full pr-14 py-4 px-5 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-2xl font-medium ${className}`}
        style={{
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: isDark 
            ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.7), rgba(75, 85, 99, 0.5))' 
            : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.7))',
          border: `2px solid ${isOpen ? 'rgba(59, 130, 246, 0.8)' : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)')}`,
          boxShadow: isOpen 
            ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 12px 40px rgba(0, 0, 0, 0.3)' 
            : isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.2)' 
              : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)'
        }}
        whileHover={{ 
          scale: disabled ? 1 : 1.01,
          y: disabled ? 0 : -1,
          transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
        }}
        whileTap={{ 
          scale: disabled ? 1 : 0.99,
          transition: { duration: 0.15 }
        }}
      >
          <span className={`block truncate transition-all duration-200 ${
            selectedOption 
              ? 'font-semibold text-base' 
              : 'font-medium text-sm opacity-75'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        
        {/* Icono de flecha */}
        <motion.div 
          className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none"
          animate={{ 
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.1 : 1
          }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0.0, 0.2, 1],
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <div className="p-1 rounded-lg" style={{
            background: isOpen 
              ? 'rgba(59, 130, 246, 0.15)' 
              : 'rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
          }}>
            <ChevronDown 
              size={16} 
              style={{ 
                color: isOpen ? 'rgba(59, 130, 246, 0.8)' : 'var(--text-secondary)',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
          className="absolute z-50 w-full min-w-[500px] mt-3 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.95), rgba(75, 85, 99, 0.9))' 
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'}`,
              boxShadow: isDark 
                ? '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 20px rgba(0, 0, 0, 0.3)' 
                : '0 25px 80px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Input de búsqueda */}
            {searchable && (
              <div className="p-4 border-b" style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
              }}>
                <div className="relative">
                  <Search 
                    size={16} 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-200 z-10"
                    style={{ 
                      color: isFocused ? 'rgba(59, 130, 246, 0.7)' : 'var(--text-secondary)',
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                    }}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-12 pr-4 py-3 text-sm rounded-xl font-medium border-0 focus:outline-none transition-all duration-300"
                    style={{
                      background: isDark 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(255, 255, 255, 0.95)',
                      color: 'var(--text-primary)',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      boxShadow: isDark 
                        ? 'inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(255, 255, 255, 0.08)' 
                        : 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(255, 255, 255, 0.9)'
                    }}
                    onFocus={(e) => {
                      setIsFocused(true);
                      e.target.style.background = isDark 
                        ? 'rgba(55, 65, 81, 0.95)' 
                        : 'rgba(255, 255, 255, 0.98)';
                      e.target.style.border = `2px solid rgba(59, 130, 246, 0.7)`;
                      e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.15), 0 8px 25px rgba(0, 0, 0, 0.2)';
                    }}
                    onBlur={(e) => {
                      setIsFocused(false);
                      e.target.style.background = isDark 
                        ? 'rgba(31, 41, 55, 0.9)' 
                        : 'rgba(255, 255, 255, 0.95)';
                      e.target.style.border = `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`;
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <motion.div 
                  className="px-6 py-8 text-sm text-center"
                  style={{ color: 'var(--text-secondary)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mb-2">🔍</div>
                  No se encontraron opciones
                </motion.div>
              ) : (
                filteredOptions.map((option, index) => {
                  // Función para extraer el número de juzgado/sala
                  const extractNumber = (text: string): string => {
                    const patterns = [
                      /SALA\s+(\d+)/i,
                      /JUZGADO.*?(\d+)/i,
                      /SOCIAL\s+(\d+)/i,
                      /TRIBUTARIA\s+(\d+)/i
                    ];
                    
                    for (const pattern of patterns) {
                      const match = text.match(pattern);
                      if (match) {
                        return match[1];
                      }
                    }
                    return '';
                  };

                  // Función para formatear el nombre con número destacado
                  const formatDisplayName = (text: string): { number: string; name: string; fullName: string } => {
                    const number = extractNumber(text);
                    const fullName = text;
                    
                    let name = text;
                    // Aumentamos el límite de caracteres para mostrar más texto
                    if (text.length > 70) {
                      const words = text.split(' ');
                      if (number) {
                        const numberIndex = words.findIndex(word => word.includes(number));
                        if (numberIndex > 0) {
                          // Mostrar más palabras del inicio y mantener el contexto del número
                          const start = words.slice(0, Math.min(5, numberIndex)).join(' ');
                          const numberPart = words.slice(numberIndex, numberIndex + 3).join(' ');
                          name = `${start}... ${numberPart}`;
                        } else {
                          name = text.substring(0, 65) + '...';
                        }
                      } else {
                        name = text.substring(0, 65) + '...';
                      }
                    }
                    
                    return { number, name, fullName };
                  };

                  const { number, name, fullName } = formatDisplayName(option.label);
                  const isSelected = option.value === value;

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(option.value)}
                      className={`relative w-full text-left mx-2 px-6 py-4 transition-all duration-300 group rounded-xl flex items-center space-x-3 ${
                         isSelected 
                           ? 'font-semibold text-base' 
                           : 'font-medium text-sm'
                       }`}
                      style={{
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                        background: isSelected 
                          ? (isDark 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.15))' 
                            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))')
                          : 'transparent',
                        borderLeft: isSelected 
                          ? (isDark 
                            ? '3px solid rgba(59, 130, 246, 0.9)' 
                            : '3px solid rgba(59, 130, 246, 0.7)')
                          : '3px solid transparent',
                        boxShadow: isSelected 
                          ? (isDark 
                            ? '0 4px 12px rgba(59, 130, 246, 0.15)' 
                            : '0 4px 12px rgba(59, 130, 246, 0.1)')
                          : 'none'
                      }}
                      whileHover={{
                        background: isSelected 
                          ? (isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)') 
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'),
                        x: 3,
                        borderLeft: '3px solid rgba(59, 130, 246, 0.6)',
                        scale: 1.01,
                        transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
                      }}
                      whileTap={{ 
                        scale: 0.99, 
                        x: 1,
                        transition: { duration: 0.15, ease: [0.4, 0.0, 0.2, 1] }
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { 
                          delay: index * 0.03, 
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1]
                        }
                      }}
                      title={fullName}
                    >
                      {/* Número destacado */}
                      {number && (
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${isSelected 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-600 text-gray-200 group-hover:bg-blue-500 group-hover:text-white'
                          }
                          transition-all duration-200
                        `}>
                          {number}
                        </div>
                      )}
                      
                      {/* Nombre del juzgado/sala */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium flex-1 min-w-0">
                            {name}
                          </span>
                        </div>
                      </div>

                      {/* Indicador de selección */}
                      {isSelected && (
                        <motion.div
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shadow-sm"
                            style={{ 
                              background: 'rgba(59, 130, 246, 0.8)',
                              boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
                            }}
                          />
                        </motion.div>
                      )}
                      
                      {/* Hover indicator */}
                      <motion.div
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                        style={{ color: 'var(--text-secondary)' }}
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {!isSelected && '→'}
                      </motion.div>

                      {/* Tooltip expandido en hover */}
                      {fullName.length > 45 && (
                        <div className="absolute left-0 top-full mt-2 w-full bg-gray-800 text-white p-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                          <div className="text-sm font-medium">{fullName}</div>
                          {number && (
                            <div className="text-xs text-gray-300 mt-1">Número: {number}</div>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DarkSelect;