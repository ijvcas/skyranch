
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
  mode: 'idle' | 'drawing' | 'editing' | 'complete';
}

interface UsePolygonManagerOptions {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

export const usePolygonManager = ({ lots, onLotSelect }: UsePolygonManagerOptions) => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isActive: false,
    currentLotId: null,
    mode: 'idle'
  });
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonCompleteListenerRef = useRef<google.maps.MapsEventListener | null>(null);

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

  // Force crosshair cursor on map
  const setCrosshairCursor = useCallback(() => {
    if (!mapRef.current) return;

    const mapDiv = mapRef.current.getDiv();
    
    // Create and inject styles for crosshair cursor
    let styleElement = document.getElementById('polygon-crosshair-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'polygon-crosshair-style';
      document.head.appendChild(styleElement);
    }
    
    styleElement.innerHTML = `
      .crosshair-mode * {
        cursor: crosshair !important;
      }
      .crosshair-mode {
        cursor: crosshair !important;
      }
    `;
    
    mapDiv.classList.add('crosshair-mode');
    console.log('Crosshair cursor applied');
  }, []);

  // Remove crosshair cursor from map
  const removeCrosshairCursor = useCallback(() => {
    if (!mapRef.current) return;

    const mapDiv = mapRef.current.getDiv();
    mapDiv.classList.remove('crosshair-mode');
    
    // Remove the style element
    const styleElement = document.getElementById('polygon-crosshair-style');
    if (styleElement) {
      styleElement.remove();
    }

    console.log('Crosshair cursor removed');
  }, []);

  // Initialize drawing manager
  const initializeDrawingManager = useCallback((map: google.maps.Map) => {
    if (drawingManagerRef.current) {
      console.log('Drawing manager already exists');
      return drawingManagerRef.current;
    }

    console.log('Creating new drawing manager...');

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillOpacity: 0.4,
        strokeWeight: 3,
        strokeOpacity: 0.8,
        editable: true,
        draggable: false,
        clickable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    console.log('Drawing manager created and set on map');
    return drawingManager;
  }, []);

  // Handle polygon completion
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    console.log('Polygon completed');
    
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

    console.log('Processing completed polygon for lot:', lot.name);

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

    // Set the correct color
    const color = getLotColor(lot);
    polygon.setOptions({
      fillColor: color,
      strokeColor: color
    });

    // Create polygon data
    const polygonData: PolygonData = {
      lotId: drawingState.currentLotId,
      polygon,
      color,
      coordinates
    };

    // Add click listener for lot selection
    polygon.addListener('click', () => {
      console.log('Polygon clicked for lot:', lot.id);
      onLotSelect(lot.id);
    });

    // Update state
    setPolygons(prev => {
      const filtered = prev.filter(p => p.lotId !== drawingState.currentLotId);
      const updated = [...filtered, polygonData];
      savePolygonsToStorage(updated);
      return updated;
    });

    // Reset drawing state and disable drawing mode
    setDrawingState({
      isActive: false,
      currentLotId: null,
      mode: 'complete'
    });

    // Disable drawing mode and restore normal cursor
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    
    removeCrosshairCursor();

    console.log('Polygon creation completed successfully');
  }, [drawingState.currentLotId, lots, polygons, getLotColor, onLotSelect, removeCrosshairCursor]);

  // Start drawing for a lot
  const startDrawing = useCallback((lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot || !drawingManagerRef.current || !mapRef.current) {
      console.log('Cannot start drawing - missing requirements', {
        hasLot: !!lot,
        hasDrawingManager: !!drawingManagerRef.current,
        hasMap: !!mapRef.current
      });
      return;
    }

    console.log('Starting polygon drawing for lot:', lot.name);
    
    setDrawingState({
      isActive: true,
      currentLotId: lotId,
      mode: 'drawing'
    });

    const color = getLotColor(lot);
    
    // Update polygon options for this drawing session
    drawingManagerRef.current.setOptions({
      polygonOptions: {
        fillColor: color,
        strokeColor: color,
        fillOpacity: 0.4,
        strokeWeight: 3,
        strokeOpacity: 0.8,
        editable: true,
        draggable: false,
        clickable: true,
      }
    });

    // Remove existing polygon complete listener
    if (polygonCompleteListenerRef.current) {
      google.maps.event.removeListener(polygonCompleteListenerRef.current);
    }

    // Add new polygon complete listener
    polygonCompleteListenerRef.current = drawingManagerRef.current.addListener('polygoncomplete', handlePolygonComplete);

    // Enable polygon drawing mode
    console.log('Enabling drawing mode...');
    drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    
    // Apply crosshair cursor after a short delay
    setTimeout(() => {
      setCrosshairCursor();
      console.log('Drawing mode and crosshair cursor enabled');
    }, 100);

  }, [lots, getLotColor, handlePolygonComplete, setCrosshairCursor]);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    console.log('Canceling polygon drawing');
    
    setDrawingState({
      isActive: false,
      currentLotId: null,
      mode: 'idle'
    });

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }

    removeCrosshairCursor();

    // Remove polygon complete listener
    if (polygonCompleteListenerRef.current) {
      google.maps.event.removeListener(polygonCompleteListenerRef.current);
      polygonCompleteListenerRef.current = null;
    }
  }, [removeCrosshairCursor]);

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

  // Save polygons to localStorage
  const savePolygonsToStorage = useCallback((polygonData: PolygonData[]) => {
    const dataToSave = polygonData.map(p => ({
      lotId: p.lotId,
      color: p.color,
      coordinates: p.coordinates
    }));
    localStorage.setItem('lotPolygons', JSON.stringify(dataToSave));
    console.log('Polygons saved to localStorage:', dataToSave.length);
  }, []);

  // Load polygons from localStorage
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
            fillOpacity: 0.4,
            strokeWeight: 3,
            strokeColor: getLotColor(lot),
            strokeOpacity: 0.8,
            editable: true,
            draggable: false,
            clickable: true,
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
    console.log('Initializing polygon manager with map');
    mapRef.current = map;
    
    // Wait for map to be fully ready before initializing drawing manager
    google.maps.event.addListenerOnce(map, 'idle', () => {
      console.log('Map is idle, initializing drawing manager');
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

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (polygonCompleteListenerRef.current) {
        google.maps.event.removeListener(polygonCompleteListenerRef.current);
      }
      removeCrosshairCursor();
    };
  }, [removeCrosshairCursor]);

  return {
    polygons,
    drawingState,
    startDrawing,
    cancelDrawing,
    deletePolygon,
    initializeWithMap,
    getLotColor
  };
};
