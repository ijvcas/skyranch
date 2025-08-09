
import { useState, useCallback, useRef } from 'react';
import { type Lot } from '@/stores/lotStore';
import { toast } from 'sonner';

interface UseDrawingManagerOptions {
  lots: Lot[];
  getLotColor: (lot: Lot) => string;
  onPolygonComplete: (polygon: google.maps.Polygon, lotId: string) => void;
}

export const useDrawingManager = ({ lots, getLotColor, onPolygonComplete }: UseDrawingManagerOptions) => {
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingManager = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonCompleteListener = useRef<google.maps.MapsEventListener | null>(null);

  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    console.log('Creating drawing manager...');
    
    const drawing = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillOpacity: 0.35,
        strokeWeight: 2,
        clickable: true,
        editable: false,
      }
    });

    drawing.setMap(map);
    drawingManager.current = drawing;

    console.log('Drawing manager initialized');
  }, []);

  const startDrawing = useCallback((lotId: string) => {
    if (!drawingManager.current || !lotId) {
      console.log('Cannot start drawing - missing requirements:', { lotId });
      toast.error('Error al iniciar el dibujo');
      return;
    }

    const lot = lots.find(l => l.id === lotId);
    if (!lot) {
      console.log('Lot not found:', lotId);
      toast.error('Lote no encontrado');
      return;
    }

    console.log('Starting drawing for lot:', lot.name);
    
    setSelectedLotId(lotId);
    setIsDrawing(true);

    // Get the color from the lot status - pasture lots are green
    const color = '#10B981'; // Green for pasture lots
    console.log('Using color:', color, 'for lot:', lot.name);

    // Remove existing listener
    if (polygonCompleteListener.current) {
      google.maps.event.removeListener(polygonCompleteListener.current);
    }

    // Add new polygon complete listener
    polygonCompleteListener.current = google.maps.event.addListener(
      drawingManager.current, 
      'polygoncomplete', 
      (polygon: google.maps.Polygon) => {
        console.log('Polygon completed for lot:', lotId);
        onPolygonComplete(polygon, lotId);
        stopDrawing();
        toast.success(`Polígono creado para lote: ${lot.name}`);
      }
    );

    // Update polygon options with selected color
    drawingManager.current.setOptions({
      polygonOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeOpacity: 0.9,
        clickable: true,
        editable: false,
      }
    });

    // Enable polygon drawing mode
    drawingManager.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    
    // Add crosshair cursor
    const mapDiv = (drawingManager.current.getMap() as google.maps.Map)?.getDiv();
    if (mapDiv) {
      mapDiv.style.cursor = 'crosshair';
    }
    
    console.log('Drawing mode activated for lot:', lotId);
    toast.info(`Dibuja el polígono para: ${lot.name}`);
  }, [lots, onPolygonComplete]);

  const stopDrawing = useCallback(() => {
    if (drawingManager.current) {
      drawingManager.current.setDrawingMode(null);
      
      // Remove crosshair cursor
      const mapDiv = (drawingManager.current.getMap() as google.maps.Map)?.getDiv();
      if (mapDiv) {
        mapDiv.style.cursor = '';
      }
    }
    
    // Remove polygon complete listener
    if (polygonCompleteListener.current) {
      google.maps.event.removeListener(polygonCompleteListener.current);
      polygonCompleteListener.current = null;
    }
    
    setIsDrawing(false);
    setSelectedLotId('');
    console.log('Drawing mode deactivated');
  }, []);

  return {
    selectedLotId,
    isDrawing,
    initializeDrawingManager,
    startDrawing,
    stopDrawing
  };
};
