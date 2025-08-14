
import { useState, useCallback, useRef, useEffect } from 'react';
import { type Lot } from '@/stores/lotStore';
import { useElegantGoogleMap } from './useElegantGoogleMap';

interface PolygonData {
  lotId: string;
  polygon: google.maps.Polygon;
  color: string;
  coordinates: { lat: number; lng: number }[];
}

interface UseMapPolygonDrawingOptions {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

export const useMapPolygonDrawing = ({ lots, onLotSelect }: UseMapPolygonDrawingOptions) => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  // Get lot color based on status
  // Get color based on lot status and animal presence
  const getLotColor = useCallback((lot: Lot) => {
    // Check if lot has animals (En Uso)
    if (lot.currentAnimals && lot.currentAnimals > 0) {
      return '#3b82f6'; // Blue for "En Uso"
    }
    
    // Check for resting status (En Descanso)
    if (lot.status === 'resting') {
      return '#f59e0b'; // Amber/Yellow for "En Descanso"
    }
    
    // Default to available (Disponible)
    return '#10b981'; // Green for "Disponible"
  }, []);

  // Initialize map and drawing manager
  const { mapRef, isMapReady } = useElegantGoogleMap({
    onMapReady: (map) => {
      console.log('Map ready, initializing drawing manager');
      
      // Create drawing manager
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillOpacity: 0.35,
          strokeWeight: 2,
          clickable: true,
          editable: true,
        }
      });

      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;

      // Handle polygon completion
      google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        console.log('Polygon completed');
        handlePolygonComplete(polygon);
      });

      // Load saved polygons
      loadSavedPolygons(map);
    }
  });

  // Handle polygon completion
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    if (!selectedLotId) {
      polygon.setMap(null);
      return;
    }

    const lot = lots.find(l => l.id === selectedLotId);
    if (!lot) {
      polygon.setMap(null);
      return;
    }

    // Remove existing polygon for this lot
    setPolygons(prev => {
      const existing = prev.find(p => p.lotId === selectedLotId);
      if (existing) {
        existing.polygon.setMap(null);
      }
      return prev.filter(p => p.lotId !== selectedLotId);
    });

    // Set polygon style
    const color = getLotColor(lot);
    polygon.setOptions({
      fillColor: color,
      strokeColor: color,
      fillOpacity: 0.35,
      strokeWeight: 2,
    });

    // Add click listener
    polygon.addListener('click', () => {
      onLotSelect(lot.id);
    });

    // Get coordinates
    const path = polygon.getPath();
    const coordinates = path.getArray().map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }));

    // Create polygon data
    const polygonData: PolygonData = {
      lotId: selectedLotId,
      polygon,
      color,
      coordinates
    };

    // Update state
    setPolygons(prev => {
      const updated = [...prev, polygonData];
      savePolygonsToStorage(updated);
      return updated;
    });

    // Stop drawing
    stopDrawing();
  }, [selectedLotId, lots, getLotColor, onLotSelect]);

  // Start drawing
  const startDrawing = useCallback((lotId: string) => {
    if (!drawingManagerRef.current || !lotId) return;

    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    console.log('Starting drawing for lot:', lot.name);
    
    setSelectedLotId(lotId);
    setIsDrawing(true);

    const color = getLotColor(lot);
    
    // Update polygon options
    drawingManagerRef.current.setOptions({
      polygonOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.35,
        strokeWeight: 2,
        clickable: true,
        editable: true,
      }
    });

    // Enable polygon drawing mode
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }, [lots, getLotColor]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    setIsDrawing(false);
    setSelectedLotId('');
  }, []);

  // Delete polygon
  const deletePolygon = useCallback((lotId: string) => {
    setPolygons(prev => {
      const polygonData = prev.find(p => p.lotId === lotId);
      if (polygonData) {
        polygonData.polygon.setMap(null);
      }
      const updated = prev.filter(p => p.lotId !== lotId);
      savePolygonsToStorage(updated);
      return updated;
    });
  }, []);

  // Save to localStorage
  const savePolygonsToStorage = useCallback((polygonData: PolygonData[]) => {
    const dataToSave = polygonData.map(p => ({
      lotId: p.lotId,
      color: p.color,
      coordinates: p.coordinates
    }));
    localStorage.setItem('lotPolygons', JSON.stringify(dataToSave));
  }, []);

  // Load from localStorage
  const loadSavedPolygons = useCallback((map: google.maps.Map) => {
    const saved = localStorage.getItem('lotPolygons');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const loadedPolygons: PolygonData[] = [];

      data.forEach((item: any) => {
        const lot = lots.find(l => l.id === item.lotId);
        if (lot && item.coordinates) {
          const polygon = new google.maps.Polygon({
            paths: item.coordinates,
            fillColor: getLotColor(lot),
            fillOpacity: 0.35,
            strokeWeight: 2,
            strokeColor: getLotColor(lot),
            clickable: true,
            editable: true,
          });

          polygon.setMap(map);
          polygon.addListener('click', () => onLotSelect(lot.id));
          
          loadedPolygons.push({
            lotId: item.lotId,
            polygon,
            color: getLotColor(lot),
            coordinates: item.coordinates
          });
        }
      });

      setPolygons(loadedPolygons);
    } catch (error) {
      console.error('Error loading saved polygons:', error);
    }
  }, [lots, getLotColor, onLotSelect]);

  return {
    mapRef,
    isMapReady,
    polygons,
    selectedLotId,
    isDrawing,
    startDrawing,
    stopDrawing,
    deletePolygon,
    getLotColor
  };
};
