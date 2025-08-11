
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CadastralFileUpload from './CadastralFileUpload';
import type { Property, CadastralParcel } from '@/services/cadastralService';
import type { ParcelStatus } from '@/utils/cadastral/types';

interface CadastralMapControlsProps {
  properties: Property[];
  selectedPropertyId: string;
  onPropertyChange: (propertyId: string) => void;
  isLoading: boolean;
  showUpload: boolean;
  onToggleUpload: () => void;
  onFileUploadSuccess: () => void;
  onCancelUpload: () => void;
  statusFilter: ParcelStatus | 'ALL';
  onStatusFilterChange: (status: ParcelStatus | 'ALL') => void;
  onParcelsDeleted?: () => void;
  parcels?: CadastralParcel[];
}


const CadastralMapControls: React.FC<CadastralMapControlsProps> = ({
  selectedPropertyId,
  showUpload,
  onToggleUpload,
  onFileUploadSuccess,
  onCancelUpload,
  onParcelsDeleted,
  parcels = []
}) => {

  return (
    <Card>
      <CardContent>
        {showUpload && (
          <CadastralFileUpload
            propertyId={selectedPropertyId}
            onSuccess={onFileUploadSuccess}
            onCancel={onCancelUpload}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CadastralMapControls;
