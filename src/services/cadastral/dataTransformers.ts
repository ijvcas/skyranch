
import type { ParcelStatus } from '@/utils/cadastral/types';
import type { CadastralParcel, Property } from '../cadastralService';

export const transformCadastralParcelFromDB = (item: any): CadastralParcel => {
  let boundaryCoordinates: { lat: number; lng: number }[] = [];
  
  try {
    if (typeof item.boundary_coordinates === 'string') {
      boundaryCoordinates = JSON.parse(item.boundary_coordinates);
    } else if (Array.isArray(item.boundary_coordinates)) {
      boundaryCoordinates = item.boundary_coordinates.map((coord: any) => ({
        lat: Number(coord.lat),
        lng: Number(coord.lng)
      }));
    }
  } catch (e) {
    console.error('Error parsing boundary coordinates for parcel:', item.id, e);
  }

  return {
    id: item.id,
    propertyId: item.property_id,
    parcelId: item.parcel_id,
    displayName: item.display_name || undefined,
    lotNumber: item.lot_number || undefined,
    boundaryCoordinates,
    areaHectares: item.area_hectares,
    classification: item.classification,
    ownerInfo: item.owner_info,
    notes: item.notes,
    status: (item.status as ParcelStatus) || 'SHOPPING_LIST',
    importedFromFile: item.imported_from_file,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
};

export const transformCadastralParcelToDB = (parcel: Omit<CadastralParcel, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    property_id: parcel.propertyId,
    parcel_id: parcel.parcelId,
    display_name: parcel.displayName,
    lot_number: parcel.lotNumber,
    boundary_coordinates: JSON.stringify(parcel.boundaryCoordinates),
    area_hectares: parcel.areaHectares,
    classification: parcel.classification,
    owner_info: parcel.ownerInfo,
    notes: parcel.notes,
    status: parcel.status || 'SHOPPING_LIST',
    imported_from_file: parcel.importedFromFile,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

export const transformPropertyFromDB = (item: any): Property => ({
  id: item.id,
  name: item.name,
  description: item.description,
  centerLat: Number(item.center_lat),
  centerLng: Number(item.center_lng),
  zoomLevel: item.zoom_level || 16,
  isActive: item.is_active,
  isMainProperty: item.is_main_property,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});

export const transformPropertyToDB = (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    name: property.name,
    description: property.description,
    center_lat: property.centerLat,
    center_lng: property.centerLng,
    zoom_level: property.zoomLevel || 16,
    is_active: property.isActive,
    is_main_property: property.isMainProperty,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};
