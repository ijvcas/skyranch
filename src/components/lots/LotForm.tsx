import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLotStore } from '@/stores/lotStore';
import { toast } from 'sonner';
import { checkPermission } from '@/services/permissionService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface LotFormProps {
  onClose: () => void;
  lot?: any;
}

const LotForm = ({ onClose, lot }: LotFormProps) => {
  const { addLot, updateLot } = useLotStore();
  const isEditing = !!lot;

  const [formData, setFormData] = useState({
    name: lot?.name || '',
    description: lot?.description || '',
    sizeHectares: lot?.sizeHectares?.toString() || '',
    capacity: lot?.capacity?.toString() || '',
    grassType: lot?.grassType || '',
    locationCoordinates: lot?.locationCoordinates || '',
    status: lot?.status || 'active',
    grassCondition: lot?.grassCondition || 'good',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPermissionError(null);

    try {
      // Check permissions before proceeding
      console.log('🔍 Checking lots_manage permission...');
      await checkPermission('lots_manage');
      
      const lotData = {
        name: formData.name,
        description: formData.description || undefined,
        sizeHectares: formData.sizeHectares ? parseFloat(formData.sizeHectares) : undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        grassType: formData.grassType || undefined,
        locationCoordinates: formData.locationCoordinates || undefined,
        status: formData.status,
        grassCondition: formData.grassCondition,
      };

      console.log('🔄 Submitting lot data:', lotData);

      const success = isEditing 
        ? await updateLot(lot.id, lotData)
        : await addLot(lotData);

      if (success) {
        toast.success(isEditing ? 'Lote actualizado exitosamente' : 'Lote creado exitosamente');
        onClose();
      } else {
        toast.error('Error al guardar el lote');
      }
    } catch (error: any) {
      console.error('❌ Error in lot form submission:', error);
      
      if (error.message?.includes('Acceso denegado')) {
        setPermissionError(error.message);
        toast.error('No tienes permisos para esta acción');
      } else {
        toast.error('Error al guardar el lote');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (permissionError) {
    return (
      <div className="p-4">
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {permissionError}
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} variant="outline" className="w-full">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre del Lote *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Lote Norte"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="resting">En Descanso</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="property">Propiedad</SelectItem>
              <SelectItem value="lista de compra">Lista de Compra</SelectItem>
              <SelectItem value="por firmar">Por Firmar</SelectItem>
              <SelectItem value="negociando">Negociando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descripción del lote..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="sizeHectares">Tamaño (hectáreas)</Label>
          <Input
            id="sizeHectares"
            type="number"
            step="0.1"
            value={formData.sizeHectares}
            onChange={(e) => handleInputChange('sizeHectares', e.target.value)}
            placeholder="10.5"
          />
        </div>
        
        <div>
          <Label htmlFor="capacity">Capacidad (animales)</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            placeholder="50"
          />
        </div>
        
        <div>
          <Label htmlFor="grassCondition">Condición del Pasto</Label>
          <Select value={formData.grassCondition} onValueChange={(value) => handleInputChange('grassCondition', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="good">Buena</SelectItem>
              <SelectItem value="fair">Regular</SelectItem>
              <SelectItem value="poor">Pobre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grassType">Tipo de Pasto</Label>
          <Input
            id="grassType"
            value={formData.grassType}
            onChange={(e) => handleInputChange('grassType', e.target.value)}
            placeholder="Ej: Brachiaria, Guinea, etc."
          />
        </div>
        
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.name}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Lote'}
        </Button>
      </div>
    </form>
  );
};

export default LotForm;
