
import { useState, useCallback } from 'react';
import { type Lot } from '@/stores/lotStore';

interface LotPolygon {
  lotId: string;
  polygon: google.maps.Polygon;
  color: string;
}

interface UseMapPolygonsOptions {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

export const useMapPolygons = ({ lots, onLotSelect }: UseMapPolygonsOptions) => {
  const [lotPolygons, setLotPolygons] = useState<LotPolygon[]>([]);

  // Get color based on lot status and animal presence
  const getLotColor = (lot: Lot) => {
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
  };

  // Save polygons to localStorage
  const savePolygons = useCallback((polygons: LotPolygon[]) => {
    const data = polygons.map(lp => ({
      lotId: lp.lotId,
      color: lp.color,
      coordinates: lp.polygon.getPath().getArray().map(point => ({
        lat: point.lat(),
        lng: point.lng()
      }))
    }));
    localStorage.setItem('lotPolygons', JSON.stringify(data));
  }, []);

  // Load saved polygons
  const loadSavedPolygons = useCallback((map: google.maps.Map) => {
    const saved = localStorage.getItem('lotPolygons');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const polygons: LotPolygon[] = [];

      data.forEach((item: any) => {
        const lot = lots.find(l => l.id === item.lotId);
        if (lot && item.coordinates) {
          const polygon = new google.maps.Polygon({
            paths: item.coordinates,
            fillColor: getLotColor(lot),
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: getLotColor(lot),
            editable: false,
            draggable: false,
          });

          polygon.setMap(map);
          polygon.addListener('click', () => onLotSelect(lot.id));
          
          polygons.push({ 
            lotId: item.lotId, 
            polygon, 
            color: getLotColor(lot) 
          });
        }
      });

      setLotPolygons(polygons);
    } catch (error) {
      console.error('Error loading saved polygons:', error);
    }
  }, [lots, onLotSelect, getLotColor]);

  // Add polygon
  const addPolygon = useCallback((lotId: string, polygon: google.maps.Polygon) => {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const color = getLotColor(lot);
    
    // Style polygon
    polygon.setOptions({
      fillColor: color,
      strokeColor: color,
    });

    // Add click listener
    polygon.addListener('click', () => onLotSelect(lot.id));

    // Remove existing polygon for this lot
    const existingIndex = lotPolygons.findIndex(lp => lp.lotId === lotId);
    if (existingIndex !== -1) {
      lotPolygons[existingIndex].polygon.setMap(null);
    }

    // Add new polygon
    const newPolygons = lotPolygons.filter(lp => lp.lotId !== lotId);
    newPolygons.push({ lotId, polygon, color });
    setLotPolygons(newPolygons);

    // Save to localStorage
    savePolygons(newPolygons);
  }, [lots, lotPolygons, onLotSelect, getLotColor, savePolygons]);

  // Delete polygon
  const deletePolygon = useCallback((lotId: string) => {
    const index = lotPolygons.findIndex(lp => lp.lotId === lotId);
    if (index !== -1) {
      lotPolygons[index].polygon.setMap(null);
      const updated = lotPolygons.filter(lp => lp.lotId !== lotId);
      setLotPolygons(updated);
      savePolygons(updated);
    }
  }, [lotPolygons, savePolygons]);

  return {
    lotPolygons,
    getLotColor,
    loadSavedPolygons,
    addPolygon,
    deletePolygon
  };
};
