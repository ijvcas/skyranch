
import { supabase } from '@/integrations/supabase/client';
import type { ParcelStatus } from '@/utils/cadastral/types';

export interface Property {
  id: string;
  name: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  zoomLevel?: number;
  isActive: boolean;
  isMainProperty: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CadastralParcel {
  id: string;
  propertyId?: string;
  parcelId: string;
  displayName?: string;
  lotNumber?: string;
  classification?: string;
  ownerInfo?: string;
  notes?: string;
  importedFromFile?: string;
  boundaryCoordinates: any;
  areaHectares?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  totalCost?: number;
  costPerSquareMeter?: number;
  sellerName?: string;
  acquisitionDate?: string;
  acquisitionNotes?: string;
  contractReference?: string;
}

// Re-export functions from the modular files
export { fetchAllProperties as getAllProperties } from './cadastral/cadastralQueries';
export { fetchCadastralParcels } from './cadastral/cadastralQueries';
export { fetchCadastralParcels as getAllParcels } from './cadastral/cadastralQueries';
export { insertCadastralParcel as saveCadastralParcel } from './cadastral/cadastralMutations';
export { updateCadastralParcelById } from './cadastral/cadastralMutations';
export { updateCadastralParcelById as updateParcel } from './cadastral/cadastralMutations';
export { insertProperty as addProperty } from './cadastral/cadastralMutations';

export const updateCadastralParcel = async (parcelId: string, updates: Partial<CadastralParcel>): Promise<boolean> => {
  try {
    console.log('Updating cadastral parcel:', parcelId, updates);
    
    // Map the interface fields to database column names
    const dbUpdates: any = {};
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lotNumber !== undefined) dbUpdates.lot_number = updates.lotNumber;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.classification !== undefined) dbUpdates.classification = updates.classification;
    if (updates.ownerInfo !== undefined) dbUpdates.owner_info = updates.ownerInfo;
    
    // New financial fields
    if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
    if (updates.costPerSquareMeter !== undefined) dbUpdates.cost_per_square_meter = updates.costPerSquareMeter;
    if (updates.sellerName !== undefined) dbUpdates.seller_name = updates.sellerName;
    if (updates.acquisitionDate !== undefined) dbUpdates.acquisition_date = updates.acquisitionDate;
    if (updates.acquisitionNotes !== undefined) dbUpdates.acquisition_notes = updates.acquisitionNotes;
    if (updates.contractReference !== undefined) dbUpdates.contract_reference = updates.contractReference;
    
    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('cadastral_parcels')
      .update(dbUpdates)
      .eq('id', parcelId);

    if (error) {
      console.error('Error updating cadastral parcel:', error);
      return false;
    }

    console.log('Cadastral parcel updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating cadastral parcel:', error);
    return false;
  }
};

export const getCadastralParcels = async (propertyId?: string): Promise<CadastralParcel[]> => {
  try {
    console.log('Loading cadastral parcels for property:', propertyId);
    
    let query = supabase
      .from('cadastral_parcels')
      .select('*')
      .order('created_at', { ascending: false });

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading cadastral parcels:', error);
      return [];
    }

    console.log('Loaded cadastral parcels:', data?.length || 0);
    
    // Map database fields to interface with proper boundary coordinates parsing
    return (data || []).map(parcel => {
      let boundaryCoordinates: { lat: number; lng: number }[] = [];
      
      // Safely parse boundary coordinates with proper type handling
      try {
        const coords = parcel.boundary_coordinates;
        
        if (typeof coords === 'string') {
          boundaryCoordinates = JSON.parse(coords);
        } else if (Array.isArray(coords)) {
          // Type cast the array elements to ensure they have lat/lng properties
          boundaryCoordinates = coords.filter(coord => 
            coord && 
            typeof coord === 'object' && 
            'lat' in coord && 
            'lng' in coord &&
            typeof coord.lat === 'number' && 
            typeof coord.lng === 'number'
          ) as { lat: number; lng: number }[];
        } else if (coords && typeof coords === 'object') {
          // Handle case where it's already a parsed object but not an array
          boundaryCoordinates = [];
        }
        
        // Ensure it's always an array
        if (!Array.isArray(boundaryCoordinates)) {
          boundaryCoordinates = [];
        }
      } catch (e) {
        console.error('Error parsing boundary coordinates for parcel:', parcel.id, e);
        boundaryCoordinates = [];
      }

      return {
        id: parcel.id,
        propertyId: parcel.property_id,
        parcelId: parcel.parcel_id,
        displayName: parcel.display_name,
        lotNumber: parcel.lot_number,
        classification: parcel.classification,
        ownerInfo: parcel.owner_info,
        notes: parcel.notes,
        importedFromFile: parcel.imported_from_file,
        boundaryCoordinates,
        areaHectares: parcel.area_hectares,
        status: parcel.status,
        createdAt: parcel.created_at,
        updatedAt: parcel.updated_at,
        // New financial fields
        totalCost: parcel.total_cost,
        costPerSquareMeter: parcel.cost_per_square_meter,
        sellerName: parcel.seller_name,
        acquisitionDate: parcel.acquisition_date,
        acquisitionNotes: parcel.acquisition_notes,
        contractReference: parcel.contract_reference,
      };
    });
  } catch (error) {
    console.error('Error loading cadastral parcels:', error);
    return [];
  }
};
