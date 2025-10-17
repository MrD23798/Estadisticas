/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Habilitar modo oscuro basado en clase
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        // Colores glassmorphism
        glass: {
          'light-bg': 'rgba(255, 255, 255, 0.25)',
          'light-border': 'rgba(255, 255, 255, 0.18)',
          'dark-bg': 'rgba(255, 255, 255, 0.1)',
          'dark-border': 'rgba(255, 255, 255, 0.1)',
        },
        // Colores personalizados para el tema
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
        'blur-sm': 'blur(4px)',
        'blur-md': 'blur(8px)',
        'blur-lg': 'blur(16px)',
      },
      boxShadow: {
        // Sombras glassmorphism
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        'glass-lg': '0 12px 40px 0 rgba(31, 38, 135, 0.4)',
        'glass-xl': '0 16px 48px 0 rgba(31, 38, 135, 0.5)',
        
        // Sombras glassmorphism para modo oscuro
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-dark-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
        'glass-dark-lg': '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
        'glass-dark-xl': '0 16px 48px 0 rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        'glass': '16px',
        'glass-sm': '12px',
        'glass-lg': '20px',
        'glass-xl': '24px',
      }
    },
  },
  plugins: [],
};