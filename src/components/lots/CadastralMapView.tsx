
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import CadastralMapControls from './CadastralMapControls';
import CadastralFilterControls from './CadastralFilterControls';
import CadastralMap from './CadastralMap';
import EditableParcelsList from './EditableParcelsList';
import FinancialSummaryCard from './FinancialSummaryCard';
import CadastralSettingsDropdown from './CadastralSettingsDropdown';
import { getAllProperties, getCadastralParcels, updateCadastralParcel, type CadastralParcel } from '@/services/cadastralService';
import type { ParcelStatus } from '@/utils/cadastral/types';

const CadastralMapView: React.FC = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'ALL'>('ALL');

  // Load properties
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: getAllProperties,
  });

  // Load parcels
  const { data: parcels = [], isLoading: isLoadingParcels, refetch: refetchParcels } = useQuery({
    queryKey: ['parcels', selectedPropertyId],
    queryFn: () => getCadastralParcels(selectedPropertyId),
    enabled: !!selectedPropertyId,
  });

  // Set default property when properties load
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      const mainProperty = properties.find(p => p.isMainProperty);
      const defaultProperty = mainProperty || properties[0];
      setSelectedPropertyId(defaultProperty.id);
    }
  }, [properties, selectedPropertyId]);

  // Filter parcels based on status
  const filteredParcels = statusFilter === 'ALL' 
    ? parcels 
    : parcels.filter(parcel => parcel.status === statusFilter);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowUpload(false);
  };

  const handleToggleUpload = () => {
    setShowUpload(!showUpload);
  };

  const handleFileUploadSuccess = () => {
    setShowUpload(false);
    refetchParcels();
    toast.success('Archivo importado correctamente');
  };

  const handleCancelUpload = () => {
    setShowUpload(false);
  };

  const handleParcelUpdate = async (parcelId: string, updates: Partial<CadastralParcel>) => {
    try {
      const success = await updateCadastralParcel(parcelId, updates);
      if (success) {
        refetchParcels();
        toast.success('Parcela actualizada correctamente');
      } else {
        toast.error('Error al actualizar la parcela');
      }
    } catch (error) {
      console.error('Error updating parcel:', error);
      toast.error('Error al actualizar la parcela');
    }
  };

  const handleParcelClick = (parcel: CadastralParcel) => {
    console.log('Parcel clicked:', parcel);
    // Future implementation for parcel detail view
  };

  const handleParcelsDeleted = () => {
    refetchParcels();
    toast.success('Todas las parcelas han sido eliminadas');
  };

  const isLoading = isLoadingProperties || isLoadingParcels;
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <div className="space-y-6">
      <CadastralMapControls
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={handlePropertyChange}
        isLoading={isLoading}
        showUpload={showUpload}
        onToggleUpload={handleToggleUpload}
        onFileUploadSuccess={handleFileUploadSuccess}
        onCancelUpload={handleCancelUpload}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onParcelsDeleted={handleParcelsDeleted}
        parcels={parcels}
      />

      {/* Financial Summary - Show when there are parcels with financial data */}
      <FinancialSummaryCard parcels={parcels} />


      <div className="space-y-6">
        <div className="relative">
          {selectedProperty && (
            <>
              <CadastralMap
                isLoaded={true}
                selectedProperty={selectedProperty}
                cadastralParcels={filteredParcels}
                statusFilter={statusFilter}
                onMapReady={() => {}}
                onParcelClick={handleParcelClick}
              />
              <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                <CadastralSettingsDropdown
                  onToggleUpload={handleToggleUpload}
                  onParcelsDeleted={handleParcelsDeleted}
                />
              </div>
            </>
          )}
        </div>
        
        <div>
          <EditableParcelsList
            parcels={filteredParcels}
            onParcelUpdate={handleParcelUpdate}
            onParcelClick={handleParcelClick}
          />
        </div>
      </div>
    </div>
  );
};

export default CadastralMapView;
