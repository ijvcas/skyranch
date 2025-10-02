
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CadastralParcel } from '@/services/cadastralService';
import { ParcelStatus } from '@/utils/cadastral/types';
import { ParcelCard } from './components/ParcelCard';
import { ParcelDetailDialog } from './components/ParcelDetailDialog';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';

interface EditableParcelProps {
  parcels: CadastralParcel[];
  onParcelUpdate: (parcelId: string, updates: Partial<CadastralParcel>) => void;
  onParcelClick: (parcel: CadastralParcel) => void;
}

const EditableParcelsList: React.FC<EditableParcelProps> = ({
  parcels,
  onParcelUpdate,
  onParcelClick
}) => {
  const { hasPermission } = useAuthPermissions();
  const hasEditPermission = hasPermission('cadastral_edit');
  
  const [editingParcel, setEditingParcel] = useState<string | null>(null);
  const [detailEditingParcel, setDetailEditingParcel] = useState<CadastralParcel | null>(null);
  const [editValues, setEditValues] = useState<{
    status: ParcelStatus;
    lotNumber: string;
  }>({ status: 'SHOPPING_LIST', lotNumber: '' });

  const handleStartEdit = (parcel: CadastralParcel) => {
    setEditingParcel(parcel.id);
    setEditValues({
      status: (parcel.status as ParcelStatus) || 'SHOPPING_LIST',
      lotNumber: parcel.lotNumber || ''
    });
  };

  const handleSaveEdit = (parcelId: string) => {
    onParcelUpdate(parcelId, {
      status: editValues.status,
      lotNumber: editValues.lotNumber
    });
    setEditingParcel(null);
  };

  const handleCancelEdit = () => {
    setEditingParcel(null);
  };

  const handleDetailEdit = (parcel: CadastralParcel) => {
    setDetailEditingParcel(parcel);
  };

  const handleDetailClose = () => {
    setDetailEditingParcel(null);
  };

  if (parcels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No hay parcelas para mostrar
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Parcelas Catastrales ({parcels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {parcels.map((parcel) => (
              <div id={`parcel-card-${parcel.id}`} key={parcel.id}>
                <ParcelCard
                  parcel={parcel}
                  isEditing={editingParcel === parcel.id}
                  editValues={editValues}
                  onEditValuesChange={setEditValues}
                  onParcelClick={onParcelClick}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDetailEdit={handleDetailEdit}
                  hasEditPermission={hasEditPermission}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ParcelDetailDialog
        parcel={detailEditingParcel}
        open={!!detailEditingParcel}
        onClose={handleDetailClose}
        onSave={onParcelUpdate}
      />
    </>
  );
};

export default EditableParcelsList;
