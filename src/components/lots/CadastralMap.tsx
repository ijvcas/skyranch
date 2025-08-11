
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Property, CadastralParcel } from '@/services/cadastralService';
import { ParcelStatus } from '@/utils/cadastral/types';
import { ParcelRenderer } from './cadastral-map/ParcelRenderer';
import { loadGoogleMapsAPI } from '@/hooks/polygon/useGoogleMapsLoader';
import FitBoundsButton from '@/components/common/FitBoundsButton';
import MapContainer from '@/components/common/MapContainer';

interface CadastralMapProps {
  isLoaded: boolean;
  selectedProperty: Property | undefined;
  cadastralParcels: CadastralParcel[];
  statusFilter: ParcelStatus | 'ALL';
  onMapReady: (map: google.maps.Map) => void;
  onParcelClick: (parcel: CadastralParcel) => void;
}


const CadastralMap: React.FC<CadastralMapProps> = ({
  isLoaded,
  selectedProperty,
  cadastralParcels,
  statusFilter,
  onMapReady,
  onParcelClick
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const parcelRendererRef = useRef<ParcelRenderer | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [parcelsRendered, setParcelsRendered] = useState(false);

  // Load Google Maps API
useEffect(() => {
  loadGoogleMapsAPI()
    .then(() => {
      console.log('✅ Google Maps API loaded successfully');
      setIsGoogleMapsLoaded(true);
    })
    .catch((error) => {
      console.error('❌ Failed to load Google Maps API:', error);
    });
}, []);

  // Initialize map once Google Maps is loaded and we have a property
  useEffect(() => {
    if (isGoogleMapsLoaded && selectedProperty && !mapRef.current) {
      console.log('🗺️ Initializing map with coordinates:', selectedProperty.centerLat, selectedProperty.centerLng);
      
      const mapElement = document.getElementById('cadastral-map');
      if (mapElement) {
        const map = new google.maps.Map(mapElement, {
          center: { lat: selectedProperty.centerLat, lng: selectedProperty.centerLng },
          zoom: selectedProperty.zoomLevel || 18,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          mapTypeControl: true,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy'
        });

        mapRef.current = map;
        parcelRendererRef.current = new ParcelRenderer(map, onParcelClick);
        
        // Wait for map to be ready
        google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
          console.log('✅ Map tiles loaded');
          setIsMapInitialized(true);
          onMapReady(map);
        });
      }
    }
  }, [isGoogleMapsLoaded, selectedProperty, onMapReady, onParcelClick]);

  // Render parcels when map is ready and we have parcels
  useEffect(() => {
    if (mapRef.current && parcelRendererRef.current && cadastralParcels.length > 0 && isMapInitialized) {
      console.log(`🎯 Rendering ${cadastralParcels.length} parcels`);
      displayCadastralParcels();
    }
  }, [cadastralParcels, statusFilter, isMapInitialized]);

  const displayCadastralParcels = () => {
    if (!parcelRendererRef.current || !mapRef.current) {
      console.log('❌ No parcel renderer or map available');
      return;
    }

    // Clear existing polygons
    console.log('🧹 Clearing existing polygons');
    parcelRendererRef.current.clearAll();

    // Filter parcels
    const filteredParcels = statusFilter === 'ALL' 
      ? cadastralParcels 
      : cadastralParcels.filter(parcel => parcel.status === statusFilter);

    console.log(`🎯 Displaying ${filteredParcels.length} filtered parcels`);
    
    if (filteredParcels.length === 0) {
      console.log('⚠️ No parcels to display');
      setParcelsRendered(false);
      return;
    }

    let renderedCount = 0;
    const bounds = new google.maps.LatLngBounds();

    filteredParcels.forEach((parcel, index) => {
      if (parcelRendererRef.current?.renderParcel(parcel, bounds, index)) {
        renderedCount++;
      }
    });

    console.log(`🎉 Rendered ${renderedCount}/${filteredParcels.length} parcels`);
    
    if (renderedCount > 0) {
      // Fit bounds after rendering
      setTimeout(() => {
        parcelRendererRef.current?.fitMapToAllParcels();
        setParcelsRendered(true);
      }, 1000);
    } else {
      setParcelsRendered(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-0 relative">
        <MapContainer>
          <div 
            id="cadastral-map" 
            className="w-full h-full rounded-lg"
          />
          {isMapInitialized && (
            <div className="absolute right-4 top-24 z-20">
              <FitBoundsButton onClick={() => parcelRendererRef.current?.fitMapToAllParcels()} />
            </div>
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

export default CadastralMap;
