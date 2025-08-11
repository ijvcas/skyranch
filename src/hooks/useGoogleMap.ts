
import { useEffect, useRef } from 'react';
import { loadGoogleMapsAPI } from '@/hooks/polygon/useGoogleMapsLoader';

// GOOGLE_MAPS_API_KEY moved to secure loader
const SKYRANCH_CENTER = { lat: 40.31764444, lng: -4.47409722 };

interface UseGoogleMapOptions {
  onMapReady?: (map: google.maps.Map, drawingManager: google.maps.drawing.DrawingManager) => void;
}


export const useGoogleMap = ({ onMapReady }: UseGoogleMapOptions = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const drawingManager = useRef<google.maps.drawing.DrawingManager | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) {
        console.log('Map container not ready');
        return;
      }

      try {
        console.log('Starting map initialization...');
        await loadGoogleMapsAPI();
        
        console.log('Google Maps API loaded, creating map...');

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: SKYRANCH_CENTER,
          zoom: 16,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT,
          }
        });

        mapInstance.current = map;
        console.log('Map created successfully');

        // Wait for map to be fully loaded before creating drawing manager
        const onMapIdle = () => {
          if (!drawingManager.current) {
            console.log('Map is idle, creating drawing manager...');
            
            // Create drawing manager with explicit options
            const drawing = new google.maps.drawing.DrawingManager({
              drawingMode: null,
              drawingControl: false,
              polygonOptions: {
                fillOpacity: 0.3,
                fillColor: '#FF0000',
                strokeWeight: 2,
                strokeColor: '#FF0000',
                editable: true,
                draggable: false,
                clickable: true,
              },
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
              },
            });

            console.log('Setting drawing manager on map...');
            drawing.setMap(map);
            drawingManager.current = drawing;
            
            // Add event listeners to verify drawing manager is working
            drawing.addListener('drawingmode_changed', () => {
              console.log('Drawing mode changed to:', drawing.getDrawingMode());
            });

            console.log('Drawing manager created and attached to map');

            // Remove the idle listener to prevent multiple calls
            google.maps.event.removeListener(idleListener);

            // Notify that map is ready
            if (onMapReady) {
              console.log('Calling onMapReady callback');
              onMapReady(map, drawing);
            }
          }
        };

        // Add idle listener
        const idleListener = map.addListener('idle', onMapIdle);

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initMap();
  }, [onMapReady]);

  return {
    mapRef,
    mapInstance: mapInstance.current,
    drawingManager: drawingManager.current
  };
};
