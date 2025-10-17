import React from 'react';

const BackgroundElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Círculos flotantes con parallax - más transparentes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/8 to-pink-400/8 rounded-full blur-xl parallax-element"></div>
      <div className="absolute top-1/4 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/8 to-cyan-400/8 rounded-full blur-lg parallax-element" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 rounded-full blur-2xl parallax-element" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-pink-400/8 to-rose-400/8 rounded-full blur-xl parallax-element" style={{ animationDelay: '3s' }}></div>
      
      {/* Formas geométricas con movimiento sutil - más transparentes */}
      <div className="absolute top-1/3 left-1/2 w-16 h-16 bg-gradient-to-br from-yellow-400/4 to-orange-400/4 transform rotate-45 blur-sm parallax-element" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-1/3 left-20 w-12 h-12 bg-gradient-to-br from-green-400/5 to-emerald-400/5 transform rotate-12 blur-sm parallax-element" style={{ animationDelay: '5s' }}></div>
      
      {/* Líneas decorativas sutiles - más transparentes */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/3 to-transparent opacity-40"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/2 to-transparent opacity-30"></div>
      
      {/* Elementos de luz con animación suave - más transparentes */}
      <div className="absolute top-1/2 left-10 w-2 h-2 bg-white/10 rounded-full loading-pulse"></div>
      <div className="absolute top-20 right-10 w-1 h-1 bg-white/12 rounded-full loading-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-white/8 rounded-full loading-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Gradientes flotantes con movimiento parallax - más transparentes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-purple-500/2 via-transparent to-transparent blur-3xl parallax-element" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-blue-500/2 via-transparent to-transparent blur-3xl parallax-element" style={{ animationDelay: '3.5s' }}></div>
      
      {/* Elementos adicionales para profundidad - más transparentes */}
      <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-gradient-to-br from-teal-400/4 to-cyan-400/4 rounded-full blur-sm parallax-element" style={{ animationDelay: '6s' }}></div>
      <div className="absolute bottom-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-violet-400/3 to-purple-400/3 rounded-full blur-lg parallax-element" style={{ animationDelay: '7s' }}></div>
    </div>
  );
};

export default BackgroundElements;