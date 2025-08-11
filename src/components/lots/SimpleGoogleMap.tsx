
import React from 'react';
import { type Lot } from '@/stores/lotStore';
import MapDrawingControls from './MapDrawingControls';
import { useGoogleMap } from '@/hooks/useGoogleMap';
import { useMapPolygons } from '@/hooks/useMapPolygons';
import { useMapDrawing } from '@/hooks/useMapDrawing';
import MapContainer from '@/components/common/MapContainer';
import FitBoundsButton from '@/components/common/FitBoundsButton';

interface SimpleGoogleMapProps {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

const SimpleGoogleMap = ({ lots, onLotSelect }: SimpleGoogleMapProps) => {
  const { selectedLotId, isDrawing, setSelectedLotId, startDrawing, cancelDrawing, finishDrawing } = useMapDrawing();
  const { lotPolygons, addPolygon, deletePolygon, loadSavedPolygons } = useMapPolygons({ lots, onLotSelect });
  
  const { mapRef, drawingManager } = useGoogleMap({
    onMapReady: (map, drawing) => {
      // Handle polygon completion
      drawing.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
        if (selectedLotId) {
          addPolygon(selectedLotId, polygon);
          finishDrawing();
          drawing.setDrawingMode(null);
        }
      });

      // Load saved polygons
      loadSavedPolygons(map);
    }
  });

// Start drawing
const handleStartDrawing = (lotId: string) => {
  startDrawing(drawingManager, lotId);
};

// Cancel drawing
const handleCancelDrawing = () => {
  cancelDrawing(drawingManager);
};

// Fit map to all polygons
const handleFitBounds = () => {
  if (!lotPolygons.length) return;
  const bounds = new google.maps.LatLngBounds();
  lotPolygons.forEach(({ polygon }) => {
    const path = polygon.getPath();
    if (path) {
      path.forEach((latLng: google.maps.LatLng) => bounds.extend(latLng));
    }
  });
  const map = lotPolygons[0]?.polygon.getMap();
  if (map) map.fitBounds(bounds);
};

  return (
    <MapContainer>
      <div ref={mapRef} className="w-full h-full z-10" />
      <div className="absolute right-4 top-24 z-20">
        <FitBoundsButton onClick={handleFitBounds} />
      </div>
      
      <MapDrawingControls
        lots={lots}
        selectedLotId={selectedLotId}
        isDrawing={isDrawing}
        lotPolygons={lotPolygons}
        onStartDrawing={handleStartDrawing}
        onDeletePolygon={deletePolygon}
        onCancelDrawing={handleCancelDrawing}
        onLotSelect={setSelectedLotId}
      />
    </MapContainer>
  );
};

export default SimpleGoogleMap;
