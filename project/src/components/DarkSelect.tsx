import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DarkSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full p-3 pr-10 rounded-lg transition-all appearance-none cursor-pointer
          bg-white dark:bg-gray-700 
          border border-slate-300 dark:border-gray-600
          text-slate-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        style={{
          backgroundImage: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none'
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            className="bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100"
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Icono personalizado de flecha */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown 
          size={20} 
          className="text-slate-400 dark:text-gray-400" 
        />
      </div>
    </div>
  );
};

export default DarkSelect;