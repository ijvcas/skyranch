
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Save, X, MapPin, Settings, DollarSign, AlertCircle } from 'lucide-react';
import type { CadastralParcel } from '@/services/cadastralService';
import { ParcelStatus, PARCEL_STATUS_LABELS, PARCEL_STATUS_COLORS } from '@/utils/cadastral/types';
import { ParcelEditForm } from './ParcelEditForm';
import { getParcelNumber, hasFinancialInfo, isIncompletePropiedad } from '../utils/parcelUtils';
import { useTimezone } from '@/hooks/useTimezone';
import PermissionGuard from '@/components/PermissionGuard';

interface ParcelCardProps {
  parcel: CadastralParcel;
  isEditing: boolean;
  editValues: {
    status: ParcelStatus;
    lotNumber: string;
  };
  onEditValuesChange: (values: { status: ParcelStatus; lotNumber: string }) => void;
  onParcelClick: (parcel: CadastralParcel) => void;
  onStartEdit: (parcel: CadastralParcel) => void;
  onSaveEdit: (parcelId: string) => void;
  onCancelEdit: () => void;
  onDetailEdit: (parcel: CadastralParcel) => void;
}

export const ParcelCard: React.FC<ParcelCardProps> = ({
  parcel,
  isEditing,
  editValues,
  onEditValuesChange,
  onParcelClick,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDetailEdit
}) => {
  const { formatCurrency } = useTimezone();
  const parcelNumber = getParcelNumber(parcel);
  const showIncompleteWarning = isIncompletePropiedad(parcel);

  const getStatusBadge = (status?: string) => {
    const parcelStatus = (status as ParcelStatus) || 'SHOPPING_LIST';
    return (
      <Badge 
        style={{ 
          backgroundColor: PARCEL_STATUS_COLORS[parcelStatus],
          color: 'white'
        }}
        className="text-xs"
      >
        {PARCEL_STATUS_LABELS[parcelStatus]}
      </Badge>
    );
  };

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-gray-50 transition-colors border-l-4"
      style={{ 
        borderLeftColor: PARCEL_STATUS_COLORS[(parcel.status as ParcelStatus) || 'SHOPPING_LIST'] 
      }}
      onClick={() => !isEditing && onParcelClick(parcel)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
              {parcelNumber}
            </div>
            <MapPin className="w-4 h-4 text-gray-400" />
            {showIncompleteWarning && (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex items-center space-x-1">
            <PermissionGuard permission="cadastral_edit" showError={false}>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetailEdit(parcel);
                }}
                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </PermissionGuard>
            {isEditing ? (
              <PermissionGuard permission="cadastral_edit" showError={false}>
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveEdit(parcel.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelEdit();
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              </PermissionGuard>
            ) : (
              <PermissionGuard permission="cadastral_edit" showError={false}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(parcel);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </PermissionGuard>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          {isEditing ? (
            <ParcelEditForm
              editValues={editValues}
              onEditValuesChange={onEditValuesChange}
              onStopPropagation={handleStopPropagation}
            />
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block">Número</label>
                <p className="font-medium text-xs mt-1">
                  {parcel.lotNumber || 'Sin número'}
                </p>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-500 uppercase tracking-wide block">Estado</label>
                <div className="mt-1">
                  {getStatusBadge(parcel.status)}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block">Área</label>
            <p className="font-medium text-green-600 text-xs mt-1">
              {parcel.areaHectares ? `${parcel.areaHectares.toFixed(4)} ha` : 'Sin calcular'}
            </p>
          </div>
        </div>

        {/* Financial Information Preview */}
        {hasFinancialInfo(parcel) && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Info. Financiera</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              {parcel.totalCost && (
                <p>Costo: {formatCurrency(parcel.totalCost)}</p>
              )}
              {parcel.sellerName && (
                <p>Vendedor: {parcel.sellerName}</p>
              )}
              {parcel.acquisitionDate && (
                <p>Fecha: {new Date(parcel.acquisitionDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Incomplete Information Warning */}
        {showIncompleteWarning && (
          <div className="mt-2 pt-2 border-t border-amber-100">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-700">Completar información financiera</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
