
import React from 'react';

interface FitBoundsButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
  iconOnly?: boolean;
}

const FitBoundsButton: React.FC<FitBoundsButtonProps> = ({ onClick, className = '', title = 'Ajustar al contenido', iconOnly = true }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto inline-flex items-center ${iconOnly ? 'justify-center h-10 w-10 p-0' : 'gap-2 px-3 py-1.5 text-sm'} rounded-md border border-black/10 bg-white/90 font-medium shadow-sm backdrop-blur hover:bg-white ${className}`}
      aria-label={title}
      title={title}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a 2 2 0 0 0-2-2h-4M3 15v4a 2 2 0 0 0 2 2h4M21 15v4a 2 2 0 0 1-2 2h-4" />
      </svg>
      {!iconOnly && (
        <span>Ajustar</span>
      )}
    </button>
  );
};

export default FitBoundsButton;
