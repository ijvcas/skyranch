
import React from 'react';

interface MapContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: string; // CSS calc string
}

// Shared container to standardize map height across the app
// Uses safe area insets for mobile devices
const MapContainer: React.FC<MapContainerProps> = ({
  children,
  className = '',
  height = 'calc(100vh - 8rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
}) => {
  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden bg-gray-100 ${className}`}
      style={{ height }}
    >
      {children}
    </div>
  );
};

export default MapContainer;
