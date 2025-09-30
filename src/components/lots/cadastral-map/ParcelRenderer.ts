
import type { CadastralParcel } from '@/services/cadastralService';
import { PARCEL_STATUS_COLORS, type ParcelStatus } from '@/utils/cadastral/types';

export class ParcelRenderer {
  private polygons: google.maps.Polygon[] = [];
  private labels: google.maps.Marker[] = [];

  constructor(private map: google.maps.Map, private onParcelClick: (parcel: CadastralParcel) => void) {}

  clearAll() {
    console.log(`🧹 Clearing ${this.polygons.length} polygons and ${this.labels.length} labels`);
    this.polygons.forEach(polygon => polygon.setMap(null));
    this.polygons = [];
    this.labels.forEach(label => label.setMap(null));
    this.labels = [];
  }

  private getParcelColor(status?: ParcelStatus | string): string {
    const parcelStatus = (status as ParcelStatus) || 'SHOPPING_LIST';
    return PARCEL_STATUS_COLORS[parcelStatus] || PARCEL_STATUS_COLORS.SHOPPING_LIST;
  }

  private calculatePolygonCenter(coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } {
    const latSum = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const lngSum = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
    return {
      lat: latSum / coordinates.length,
      lng: lngSum / coordinates.length
    };
  }

  private getParcelDisplayNumber(parcel: CadastralParcel): string {
    // Priority: lotNumber > extracted number from parcelId > fallback to parcelId
    if (parcel.lotNumber) {
      return parcel.lotNumber;
    }
    
    // Try to extract number from parcelId
    const match = parcel.parcelId.match(/\d+/);
    if (match) {
      return match[0];
    }
    
    return parcel.parcelId;
  }

  renderParcel(parcel: CadastralParcel, bounds: google.maps.LatLngBounds, index: number = 0, customColor?: string): boolean {
    // Ensure boundaryCoordinates exists and is an array
    if (!parcel.boundaryCoordinates || !Array.isArray(parcel.boundaryCoordinates) || parcel.boundaryCoordinates.length < 3) {
      console.warn(`❌ Parcel ${parcel.parcelId} has no valid boundary coordinates or insufficient coordinates`);
      return false;
    }

    // Use coordinates EXACTLY as stored - no transformations, but filter invalid ones
    const coordinates = parcel.boundaryCoordinates.filter(coord => 
      coord && 
      typeof coord.lat === 'number' && 
      typeof coord.lng === 'number' &&
      !isNaN(coord.lat) && 
      !isNaN(coord.lng) &&
      coord.lat !== 0 && coord.lng !== 0
    );

    if (coordinates.length < 3) {
      console.warn(`❌ Parcel ${parcel.parcelId} has insufficient valid coordinates: ${coordinates.length}/3 required`);
      return false;
    }

    const displayNumber = this.getParcelDisplayNumber(parcel);
    console.log(`🗺️ Rendering parcel ${parcel.parcelId} as number ${displayNumber} with ${coordinates.length} coordinates`);
    console.log(`📍 Sample coordinate: ${coordinates[0].lat.toFixed(8)}, ${coordinates[0].lng.toFixed(8)}`);

    // Use custom color if provided, otherwise use status color
    const color = customColor || this.getParcelColor(parcel.status);
    
    // Create polygon with clean styling
    const polygon = new google.maps.Polygon({
      paths: coordinates,
      fillColor: color,
      fillOpacity: 0.4,
      strokeColor: '#333333',
      strokeWeight: 2,
      clickable: true,
      editable: false,
      zIndex: 1,
    });

    polygon.setMap(this.map);
    this.polygons.push(polygon);

    // Extend bounds for proper map fitting
    coordinates.forEach(coord => {
      bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
    });

    // Add click listener and hover effects
    polygon.addListener('click', () => {
      console.log(`🖱️ Clicked parcel: ${parcel.parcelId} (${displayNumber})`);
      this.onParcelClick(parcel);
    });
    polygon.addListener('mouseover', () => {
      polygon.setOptions({ strokeWeight: 3, fillOpacity: 0.55 });
    });
    polygon.addListener('mouseout', () => {
      polygon.setOptions({ strokeWeight: 2, fillOpacity: 0.4 });
    });

    // Create label with correct parcel number and smaller font size
    const center = this.calculatePolygonCenter(coordinates);
    
    const label = new google.maps.Marker({
      position: center,
      map: this.map,
      icon: {
        path: 'M 0,0 0,0',
        scale: 1,
        fillOpacity: 0,
        strokeOpacity: 0
      },
      label: {
        text: displayNumber,
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif'
      },
      clickable: true,
      title: `Parcela ${displayNumber}${parcel.areaHectares ? ` - ${parcel.areaHectares.toFixed(4)} ha` : ''}`,
      zIndex: 10000,
      optimized: false
    });

    // Add click listener to label
    label.addListener('click', () => {
      console.log(`🏷️ Clicked label for parcel: ${parcel.parcelId} (${displayNumber})`);
      this.onParcelClick(parcel);
    });

    this.labels.push(label);

    // Enhanced info window with area information
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-lg mb-2">Parcela ${displayNumber}</h3>
          <p class="mb-1"><strong>ID:</strong> ${parcel.parcelId}</p>
          ${parcel.areaHectares ? `<p class="mb-1"><strong>Área:</strong> ${parcel.areaHectares.toFixed(4)} hectáreas</p>` : ''}
          ${parcel.status ? `<p class="mb-1"><strong>Estado:</strong> ${parcel.status}</p>` : ''}
          ${parcel.notes ? `<p class="mb-1"><strong>Notas:</strong> ${parcel.notes}</p>` : ''}
        </div>
      `
    });

    polygon.addListener('rightclick', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        infoWindow.setPosition(event.latLng);
        infoWindow.open(this.map);
      }
    });

    console.log(`✅ Parcel ${displayNumber} rendered successfully with area: ${parcel.areaHectares?.toFixed(4) || 'N/A'} ha`);
    return true;
  }

  // Fit map bounds to show all rendered parcels
  fitMapToAllParcels() {
    if (this.polygons.length === 0) {
      console.log('⚠️ No polygons to fit bounds to');
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    this.polygons.forEach(polygon => {
      const path = polygon.getPath();
      path.forEach(latLng => {
        bounds.extend(latLng);
      });
    });

    console.log(`🎯 Fitting map bounds to ${this.polygons.length} parcels`);
    this.map.fitBounds(bounds);
    
    // Ensure reasonable zoom level
    google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
      const zoom = this.map.getZoom();
      if (zoom && zoom > 20) {
        this.map.setZoom(20);
      }
    });
  }
}
