import React from 'react';

interface SalesianosLogoProps {
  className?: string;
  showText?: boolean;
}

export const SalesianosLogo: React.FC<SalesianosLogoProps> = ({ 
  className = 'w-9 h-9',
  showText = false
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Crisp vector emblem of Salesianos Córdoba 125 */}
      <img
        src="/salesianos-logo.svg"
        alt="Salesianos Córdoba"
        className="w-full h-full object-contain filter drop-shadow-xs"
        onError={(e) => {
          // fallback to jpg if svg has any issue
          (e.currentTarget as HTMLImageElement).src = '/salesianos-logo.jpg';
        }}
      />
      {showText && (
        <span className="sr-only">Salesianos Córdoba</span>
      )}
    </div>
  );
};
