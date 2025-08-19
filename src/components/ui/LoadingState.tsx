import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Cargando..." }) => {
  return (
    <div className="container mx-auto py-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <div className="text-muted-foreground">{message}</div>
      </div>
    </div>
  );
};

export default LoadingState;