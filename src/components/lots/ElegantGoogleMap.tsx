
import React, { useState } from 'react';
import { type Lot } from '@/stores/lotStore';
import { useElegantGoogleMap } from '@/hooks/useElegantGoogleMap';
import { usePolygonManager } from '@/hooks/usePolygonManager';
import ElegantPolygonControls from './controls/ElegantPolygonControls';
import MapContainer from '@/components/common/MapContainer';
import FitBoundsButton from '@/components/common/FitBoundsButton';

interface ElegantGoogleMapProps {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

const ElegantGoogleMap = ({ lots, onLotSelect }: ElegantGoogleMapProps) => {
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const {
    polygons,
    drawingState,
    startDrawing,
    cancelDrawing,
    deletePolygon,
    initializeWithMap,
    getLotColor
  } = usePolygonManager({ 
    lots, 
    onLotSelect: (lotId) => {
      // Only call onLotSelect when clicking on a polygon, not when selecting for drawing
      onLotSelect(lotId);
    }
  });

  const { mapRef, isMapReady, map } = useElegantGoogleMap({
    onMapReady: (map) => {
      console.log('Elegant Google Map initialized');
      initializeWithMap(map);
    }
  });

  // Handle lot selection for drawing (internal state only)
  const handleLotSelectForDrawing = (lotId: string) => {
    setSelectedLotId(lotId);
    // Don't call onLotSelect here - this is just for internal selection
  };

  // Fit map to all polygons
  const handleFitBounds = () => {
    if (!polygons.length || !map) return;
    const bounds = new google.maps.LatLngBounds();
    polygons.forEach(p => {
      const path = p.polygon.getPath();
      if (path) {
        path.forEach((latLng: google.maps.LatLng) => bounds.extend(latLng));
      }
    });
    map.fitBounds(bounds);
  };

  return (
    <MapContainer>
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando mapa elegante...</p>
            <p className="text-sm text-gray-500">Inicializando controles de polígonos</p>
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />
      {/* Fit bounds control */}
      {isMapReady && (
        <div className="absolute right-4 top-16 z-20">
          <FitBoundsButton onClick={handleFitBounds} />
        </div>
      )}
      
      {/* Elegant controls overlay - positioned within the map container */}
      {isMapReady && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="pointer-events-auto">
            <ElegantPolygonControls
              lots={lots}
              selectedLotId={selectedLotId}
              drawingState={drawingState}
              polygons={polygons.map(p => ({ lotId: p.lotId, color: p.color }))}
              onStartDrawing={startDrawing}
              onCancelDrawing={cancelDrawing}
              onDeletePolygon={deletePolygon}
              onLotSelect={handleLotSelectForDrawing}
              getLotColor={getLotColor}
            />
          </div>
        </div>
      )}
    </MapContainer>
  );
};

export default ElegantGoogleMap;
