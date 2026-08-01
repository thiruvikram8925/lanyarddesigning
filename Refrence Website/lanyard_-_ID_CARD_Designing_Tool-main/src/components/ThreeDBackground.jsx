import React from 'react';

export default function ThreeDBackground({ children, className = "" }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-b from-[#162d37] via-[#1a3642] to-[#12242c] ${className}`}>
      {/* Soft Ambient Radial Highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-[#244857]/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Depth Grid */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
