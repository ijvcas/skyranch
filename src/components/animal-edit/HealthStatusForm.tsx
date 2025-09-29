import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissionCheck } from '@/hooks/usePermissions';
import { AlertTriangle } from 'lucide-react';
import DeathConfirmationDialog from './DeathConfirmationDialog';
import SaleConfirmationDialog from '@/components/dialogs/SaleConfirmationDialog';

interface HealthStatusFormProps {
  formData: {
    id?: string;
    name?: string;
    healthStatus: string;
    notes: string;
    lifecycleStatus?: string;
    dateOfDeath?: string;
    causeOfDeath?: string;
  };
  onInputChange: (field: string, value: string) => void;
  disabled?: boolean;
}

const HealthStatusForm = ({ 
  formData, 
  onInputChange, 
  disabled 
}: HealthStatusFormProps) => {
  const [showDeathConfirmation, setShowDeathConfirmation] = useState(false);
  const [showSaleConfirmation, setShowSaleConfirmation] = useState(false);
  const [pendingLifecycleChange, setPendingLifecycleChange] = useState<string | null>(null);
  const { hasAccess: canDeclareDeaths } = usePermissionCheck('animals_declare_death');
  const { hasAccess: canDeclareSales } = usePermissionCheck('animals_declare_sale');

  const handleLifecycleChange = (value: string) => {
    if (value === 'deceased' && formData.lifecycleStatus !== 'deceased') {
      if (!canDeclareDeaths) {
        return;
      }
      setPendingLifecycleChange(value);
      setShowDeathConfirmation(true);
    } else if (value === 'sold' && formData.lifecycleStatus !== 'sold') {
      if (!canDeclareSales) {
        return;
      }
      setPendingLifecycleChange(value);
      setShowSaleConfirmation(true);
    } else {
      onInputChange('lifecycleStatus', value);
    }
  };

  const handleDeathConfirmation = () => {
    if (pendingLifecycleChange) {
      onInputChange('lifecycleStatus', pendingLifecycleChange);
      
      if (pendingLifecycleChange === 'active') {
        onInputChange('dateOfDeath', '');
        onInputChange('causeOfDeath', '');
      }
      
      setShowDeathConfirmation(false);
      setPendingLifecycleChange(null);
    }
  };

  const handleDeathCancel = () => {
    setShowDeathConfirmation(false);
    setPendingLifecycleChange(null);
  };

  const handleSaleConfirmation = () => {
    if (pendingLifecycleChange) {
      onInputChange('lifecycleStatus', pendingLifecycleChange);
      setShowSaleConfirmation(false);
      setPendingLifecycleChange(null);
    }
  };

  const handleSaleCancel = () => {
    setShowSaleConfirmation(false);
    setPendingLifecycleChange(null);
  };

  const isDeceased = formData.lifecycleStatus === 'deceased';
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Estado de Salud</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="healthStatus">Estado de Salud</Label>
          <Select 
            value={formData.healthStatus} 
            onValueChange={(value) => onInputChange('healthStatus', value)} 
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el estado de salud" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Saludable</SelectItem>
              <SelectItem value="sick">Enfermo</SelectItem>
              <SelectItem value="injured">Herido</SelectItem>
              <SelectItem value="pregnant">Embarazada</SelectItem>
              <SelectItem value="recovering">En Recuperación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="lifecycleStatus">Estado de Vida</Label>
            {!canDeclareDeaths && !isDeceased && (
              <Alert className="mb-2 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  No tienes permisos para declarar fallecimientos. Solo administradores y gerentes pueden hacerlo.
                </AlertDescription>
              </Alert>
            )}
            {!canDeclareSales && formData.lifecycleStatus !== 'sold' && (
              <Alert className="mb-2 border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  No tienes permisos para declarar ventas. Solo administradores y gerentes pueden hacerlo.
                </AlertDescription>
              </Alert>
            )}
            <div className="relative">
              <select
                value={formData.lifecycleStatus || 'active'}
                onChange={(e) => handleLifecycleChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="active">Activo</option>
                <option 
                  value="sold"
                  disabled={!canDeclareSales && formData.lifecycleStatus !== 'sold'}
                >
                  Vendido
                </option>
                <option 
                  value="deceased" 
                  disabled={!canDeclareDeaths && !isDeceased}
                >
                  Fallecido
                </option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="dateOfDeath">Fecha de Fallecimiento</Label>
            <Input
              id="dateOfDeath"
              type="date"
              value={formData.dateOfDeath || ''}
              onChange={(e) => onInputChange('dateOfDeath', e.target.value)}
              disabled={disabled || !isDeceased}
              max={today}
              required={isDeceased}
            />
            {isDeceased && !formData.dateOfDeath && (
              <p className="text-sm text-red-600 mt-1">
                La fecha de fallecimiento es obligatoria
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="causeOfDeath">Causa</Label>
            <Input
              id="causeOfDeath"
              type="text"
              value={formData.causeOfDeath || ''}
              onChange={(e) => onInputChange('causeOfDeath', e.target.value)}
              disabled={disabled || !isDeceased}
              placeholder="Motivo del fallecimiento"
              required={isDeceased}
            />
            {isDeceased && !formData.causeOfDeath && (
              <p className="text-sm text-red-600 mt-1">
                La causa de fallecimiento es obligatoria
              </p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => onInputChange('notes', e.target.value)}
            placeholder="Notas adicionales sobre el animal..."
            disabled={disabled}
            rows={6}
            className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">
            Escribe cualquier información adicional relevante sobre el animal.
          </p>
        </div>

        <DeathConfirmationDialog
          isOpen={showDeathConfirmation}
          onClose={handleDeathCancel}
          onConfirm={handleDeathConfirmation}
          animalName={formData.name || 'el animal'}
        />

        <SaleConfirmationDialog
          isOpen={showSaleConfirmation}
          animalId={formData.id || ''}
          animalName={formData.name || 'Animal'}
          onClose={handleSaleCancel}
          onSaleConfirmed={handleSaleConfirmation}
        />
      </CardContent>
    </Card>
  );
};

export default HealthStatusForm;