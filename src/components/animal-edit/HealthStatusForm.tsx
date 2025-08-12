
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface HealthStatusFormProps {
  formData: {
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
            <Select 
              value={formData.lifecycleStatus || 'active'} 
              onValueChange={(value) => onInputChange('lifecycleStatus', value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado de vida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="deceased">Fallecido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dateOfDeath">Fecha de Fallecimiento</Label>
            <Input
              id="dateOfDeath"
              type="date"
              value={formData.dateOfDeath || ''}
              onChange={(e) => onInputChange('dateOfDeath', e.target.value)}
              disabled={disabled || (formData.lifecycleStatus !== 'deceased')}
            />
          </div>
          <div>
            <Label htmlFor="causeOfDeath">Causa</Label>
            <Input
              id="causeOfDeath"
              type="text"
              value={formData.causeOfDeath || ''}
              onChange={(e) => onInputChange('causeOfDeath', e.target.value)}
              disabled={disabled || (formData.lifecycleStatus !== 'deceased')}
              placeholder="Motivo del fallecimiento"
            />
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
      </CardContent>
    </Card>
  );
};

export default HealthStatusForm;
