
import { useState, useCallback, useRef, useEffect } from 'react';
import { type Lot } from '@/stores/lotStore';

interface PolygonData {
  lotId: string;
  polygon: google.maps.Polygon;
  color: string;
  coordinates: { lat: number; lng: number }[];
}

interface DrawingState {
  isActive: boolean;
  currentLotId: string | null;
  mode: 'idle' | 'drawing' | 'complete';
}

interface UseGoogleMapsDrawingOptions {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

export const useGoogleMapsDrawing = ({ lots, onLotSelect }: UseGoogleMapsDrawingOptions) => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isActive: false,
    currentLotId: null,
    mode: 'idle'
  });
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

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

  // Initialize drawing manager properly
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    console.log('Initializing Google Maps Drawing Manager...');
    
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      markerOptions: {
        draggable: false
      },
      polygonOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true,
        editable: true,
        zIndex: 1
      }
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Add polygon complete listener
    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      console.log('Polygon completed via Drawing Manager');
      handlePolygonComplete(polygon);
    });

    console.log('Drawing Manager initialized successfully');
    return drawingManager;
  }, []);

  // Handle polygon completion
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    console.log('Processing completed polygon...');
    
    if (!drawingState.currentLotId) {
      console.log('No current lot selected, removing polygon');
      polygon.setMap(null);
      return;
    }

    const lot = lots.find(l => l.id === drawingState.currentLotId);
    if (!lot) {
      console.log('Lot not found, removing polygon');
      polygon.setMap(null);
      return;
    }

    // Remove existing polygon for this lot
    const existingIndex = polygons.findIndex(p => p.lotId === drawingState.currentLotId);
    if (existingIndex !== -1) {
      polygons[existingIndex].polygon.setMap(null);
    }

    // Get coordinates
    const path = polygon.getPath();
    const coordinates = path.getArray().map(point => ({
      lat: point.lat(),
      lng: point.lng()
    }));

    // Set the correct color for the lot
    const color = getLotColor(lot);
    polygon.setOptions({
      fillColor: color,
      strokeColor: color,
      fillOpacity: 0.35,
      strokeWeight: 2,
      clickable: true,
      editable: true
    });

    // Add click listener
    polygon.addListener('click', () => {
      console.log('Polygon clicked for lot:', lot.id);
      onLotSelect(lot.id);
    });

    // Create polygon data
    const polygonData: PolygonData = {
      lotId: drawingState.currentLotId,
      polygon,
      color,
      coordinates
    };

    // Update state
    setPolygons(prev => {
      const filtered = prev.filter(p => p.lotId !== drawingState.currentLotId);
      const updated = [...filtered, polygonData];
      savePolygonsToStorage(updated);
      return updated;
    });

    // Stop drawing mode
    stopDrawing();

    console.log('Polygon creation completed successfully');
  }, [drawingState.currentLotId, lots, polygons, getLotColor, onLotSelect]);

  // Start drawing
  const startDrawing = useCallback((lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot || !drawingManagerRef.current) {
      console.log('Cannot start drawing - missing requirements');
      return;
    }

    console.log('Starting polygon drawing for lot:', lot.name);
    
    setDrawingState({
      isActive: true,
      currentLotId: lotId,
      mode: 'drawing'
    });

    const color = getLotColor(lot);
    
    // Update polygon options for this lot
    drawingManagerRef.current.setOptions({
      polygonOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.35,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1
      }
    });

    // Enable polygon drawing mode
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    
    console.log('Drawing mode activated');
  }, [lots, getLotColor]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    console.log('Stopping drawing mode');
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }

    setDrawingState({
      isActive: false,
      currentLotId: null,
      mode: 'idle'
    });
  }, []);

  // Delete polygon
  const deletePolygon = useCallback((lotId: string) => {
    console.log('Deleting polygon for lot:', lotId);
    const polygonIndex = polygons.findIndex(p => p.lotId === lotId);
    if (polygonIndex !== -1) {
      polygons[polygonIndex].polygon.setMap(null);
      const updated = polygons.filter(p => p.lotId !== lotId);
      setPolygons(updated);
      savePolygonsToStorage(updated);
    }
  }, [polygons]);

  // Save to localStorage
  const savePolygonsToStorage = useCallback((polygonData: PolygonData[]) => {
    const dataToSave = polygonData.map(p => ({
      lotId: p.lotId,
      color: p.color,
      coordinates: p.coordinates
    }));
    localStorage.setItem('lotPolygons', JSON.stringify(dataToSave));
    console.log('Polygons saved to localStorage');
  }, []);

  // Load from localStorage
  const loadPolygonsFromStorage = useCallback((map: google.maps.Map) => {
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
      console.log('Loaded polygons from storage:', loadedPolygons.length);
    } catch (error) {
      console.error('Error loading saved polygons:', error);
    }
  }, [lots, getLotColor, onLotSelect]);

  // Initialize with map
  const initializeWithMap = useCallback((map: google.maps.Map) => {
    console.log('Initializing drawing system with map');
    mapRef.current = map;
    
    // Initialize drawing manager after map is ready
    google.maps.event.addListenerOnce(map, 'idle', () => {
      initializeDrawingManager(map);
      loadPolygonsFromStorage(map);
    });
  }, [initializeDrawingManager, loadPolygonsFromStorage]);

  // Update polygon colors when lot status changes
  useEffect(() => {
    polygons.forEach(polygonData => {
      const lot = lots.find(l => l.id === polygonData.lotId);
      if (lot) {
        const newColor = getLotColor(lot);
        if (newColor !== polygonData.color) {
          polygonData.polygon.setOptions({
            fillColor: newColor,
            strokeColor: newColor
          });
          polygonData.color = newColor;
        }
      }
    });
  }, [lots, polygons, getLotColor]);

  return {
    polygons,
    drawingState,
    startDrawing,
    stopDrawing,
    deletePolygon,
    initializeWithMap,
    getLotColor
  };
};
