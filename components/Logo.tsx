import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-32 h-auto", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icono Vectorial */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-square flex-shrink-0"
      >
        {/* Envoltorio del Cupcake (Marrón Chocolate) */}
        <path
          d="M20 60 L30 90 H70 L80 60 H20 Z"
          fill="#5D2E1F"
          stroke="#5D2E1F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Líneas del envoltorio */}
        <path d="M35 90 L30 60" stroke="#8B4513" strokeWidth="2" />
        <path d="M50 90 L50 60" stroke="#8B4513" strokeWidth="2" />
        <path d="M65 90 L70 60" stroke="#8B4513" strokeWidth="2" />

        {/* Glaseado (Crema Suave) */}
        <path
          d="M15 60 C15 45 25 35 35 35 C35 25 45 15 60 20 C75 15 85 30 85 40 C95 45 90 60 80 60 H20 C10 60 10 50 15 60 Z"
          fill="#FEF3C7"
          stroke="#D97706"
          strokeWidth="2"
        />

        {/* Flecha de Crecimiento (Rojo) */}
        <path
          d="M30 55 L45 45 L60 55 L85 25"
          stroke="#DC2626"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M85 25 L70 25 M85 25 L85 40"
          stroke="#DC2626"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Monedas (Oro) */}
        <circle cx="75" cy="80" r="12" fill="#D98E28" stroke="#B45309" strokeWidth="2" />
        <text x="75" y="85" fontSize="14" fontWeight="bold" fill="#78350F" textAnchor="middle">$</text>
        
        <circle cx="25" cy="80" r="8" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
      </svg>

      {/* Texto del Logo */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline">
            <span className="font-extrabold text-2xl text-[#5D2E1F] dark:text-amber-100 tracking-tight">Horne</span>
            <span className="font-extrabold text-2xl text-[#D98E28] tracking-tight">Fin</span>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400 font-bold -mt-0.5 whitespace-nowrap">
            Gestión de Repostería
          </span>
        </div>
      )}
    </div>
  );
};