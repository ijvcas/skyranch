
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CadastralFileUpload from './CadastralFileUpload';
import type { Property, CadastralParcel } from '@/services/cadastralService';
import type { ParcelStatus } from '@/utils/cadastral/types';
import { Users } from 'lucide-react';

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
  onOpenOwnershipAnalysis?: () => void;
}


const CadastralMapControls: React.FC<CadastralMapControlsProps> = ({
  selectedPropertyId,
  showUpload,
  onToggleUpload,
  onFileUploadSuccess,
  onCancelUpload,
  onParcelsDeleted,
  parcels = [],
  onOpenOwnershipAnalysis
}) => {

  return (
    <>
      {showUpload ? (
        <Card>
          <CardContent>
            <CadastralFileUpload
              propertyId={selectedPropertyId}
              onSuccess={onFileUploadSuccess}
              onCancel={onCancelUpload}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-end">
          <Button
            onClick={onOpenOwnershipAnalysis}
            variant="outline"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Análisis de Propietarios
          </Button>
        </div>
      )}
    </>
  );
};

export default CadastralMapControls;
