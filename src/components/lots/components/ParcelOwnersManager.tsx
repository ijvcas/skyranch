import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, AlertTriangle } from 'lucide-react';
import { ParcelOwner, getParcelOwners, createParcelOwner, updateParcelOwner, deleteParcelOwner, validateOwnershipPercentage } from '@/services/parcelOwnersService';
import { OwnerContactCard } from './OwnerContactCard';
import { useToast } from '@/hooks/use-toast';
import PermissionGuard from '@/components/PermissionGuard';

interface ParcelOwnersManagerProps {
  parcelId: string;
  onOwnersChange?: (owners: ParcelOwner[]) => void;
}

interface OwnerFormData {
  owner_name: string;
  owner_type: 'individual' | 'company' | 'cooperative' | 'government';
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  identification_number: string;
  ownership_percentage: string;
  is_primary_contact: boolean;
  notes: string;
}

const initialFormData: OwnerFormData = {
  owner_name: '',
  owner_type: 'individual',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  identification_number: '',
  ownership_percentage: '100',
  is_primary_contact: false,
  notes: '',
};

export const ParcelOwnersManager: React.FC<ParcelOwnersManagerProps> = ({
  parcelId,
  onOwnersChange,
}) => {
  const [owners, setOwners] = useState<ParcelOwner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<ParcelOwner | null>(null);
  const [formData, setFormData] = useState<OwnerFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOwners();
  }, [parcelId]);

  const loadOwners = async () => {
    try {
      const data = await getParcelOwners(parcelId);
      setOwners(data);
      onOwnersChange?.(data);
    } catch (error) {
      console.error('Error loading owners:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los propietarios",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const percentage = parseFloat(formData.ownership_percentage);
      
      if (percentage <= 0 || percentage > 100) {
        toast({
          title: "Error",
          description: "El porcentaje debe estar entre 1 y 100",
          variant: "destructive",
        });
        return;
      }

      const isValid = await validateOwnershipPercentage(
        parcelId, 
        editingOwner?.id, 
        percentage
      );

      if (!isValid) {
        toast({
          title: "Error",
          description: "El porcentaje total de propiedad no puede exceder el 100%",
          variant: "destructive",
        });
        return;
      }

      const ownerData = {
        parcel_id: parcelId,
        owner_name: formData.owner_name,
        owner_type: formData.owner_type,
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        contact_address: formData.contact_address || undefined,
        identification_number: formData.identification_number || undefined,
        ownership_percentage: percentage,
        is_primary_contact: formData.is_primary_contact,
        notes: formData.notes || undefined,
      };

      if (editingOwner) {
        await updateParcelOwner(editingOwner.id, ownerData);
        toast({
          title: "Éxito",
          description: "Propietario actualizado correctamente",
        });
      } else {
        await createParcelOwner(ownerData);
        toast({
          title: "Éxito",
          description: "Propietario agregado correctamente",
        });
      }

      setFormData(initialFormData);
      setEditingOwner(null);
      setShowForm(false);
      loadOwners();
    } catch (error) {
      console.error('Error saving owner:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el propietario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (owner: ParcelOwner) => {
    setEditingOwner(owner);
    setFormData({
      owner_name: owner.owner_name,
      owner_type: owner.owner_type,
      contact_phone: owner.contact_phone || '',
      contact_email: owner.contact_email || '',
      contact_address: owner.contact_address || '',
      identification_number: owner.identification_number || '',
      ownership_percentage: owner.ownership_percentage.toString(),
      is_primary_contact: owner.is_primary_contact,
      notes: owner.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (ownerId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este propietario?')) {
      return;
    }

    try {
      await deleteParcelOwner(ownerId);
      toast({
        title: "Éxito",
        description: "Propietario eliminado correctamente",
      });
      loadOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el propietario",
        variant: "destructive",
      });
    }
  };

  const totalOwnership = owners.reduce((sum, owner) => sum + owner.ownership_percentage, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Propietarios</CardTitle>
          </div>
          <PermissionGuard permission="cadastral_edit" fallback={null} showError={false}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingOwner(null);
                setFormData(initialFormData);
                setShowForm(!showForm);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </PermissionGuard>
        </div>
        {totalOwnership !== 100 && owners.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Porcentaje total de propiedad: {totalOwnership}% 
              {totalOwnership < 100 && ' (falta especificar propietarios)'}
              {totalOwnership > 100 && ' (excede el 100%)'}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Nombre del Propietario *</Label>
                    <Input
                      id="owner_name"
                      value={formData.owner_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="owner_type">Tipo de Propietario</Label>
                    <Select
                      value={formData.owner_type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, owner_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                        <SelectItem value="cooperative">Cooperativa</SelectItem>
                        <SelectItem value="government">Gobierno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Teléfono</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identification_number">Número de Identificación</Label>
                    <Input
                      id="identification_number"
                      value={formData.identification_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, identification_number: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownership_percentage">Porcentaje de Propiedad (%)</Label>
                    <Input
                      id="ownership_percentage"
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={formData.ownership_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownership_percentage: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_address">Dirección</Label>
                  <Input
                    id="contact_address"
                    value={formData.contact_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary_contact"
                    checked={formData.is_primary_contact}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_primary_contact: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_primary_contact">Contacto principal</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : editingOwner ? 'Actualizar' : 'Agregar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingOwner(null);
                      setFormData(initialFormData);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {owners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay propietarios registrados para esta parcela
          </div>
        ) : (
          <div className="space-y-3">
            {owners.map((owner) => (
              <OwnerContactCard
                key={owner.id}
                owner={owner}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};