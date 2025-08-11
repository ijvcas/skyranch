
import React from 'react';

interface FitBoundsButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
}

const FitBoundsButton: React.FC<FitBoundsButtonProps> = ({ onClick, className = '', title = 'Ajustar al contenido' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur hover:bg-white ${className}`}
      aria-label={title}
      title={title}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
      </svg>
      Ajustar
    </button>
  );
};

export default FitBoundsButton;
