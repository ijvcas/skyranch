
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLotStore } from '@/stores/lotStore';
import { useAnimalStore } from '@/stores/animalStore';
import { toast } from 'sonner';

interface AnimalAssignmentFormProps {
  lotId: string;
  onClose: () => void;
}

const AnimalAssignmentForm = ({ lotId, onClose }: AnimalAssignmentFormProps) => {
  const { assignAnimal } = useLotStore();
  const { animals, loadAnimals } = useAnimalStore();
  
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectMultiple, setSelectMultiple] = useState(false);

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  // Filter animals that are not currently assigned to any lot (using correct property name)
  const availableAnimals = animals.filter(animal => !animal.current_lot_id);

  const handleAnimalSelection = (animalId: string, checked: boolean) => {
    if (selectMultiple) {
      setSelectedAnimalIds(prev => 
        checked 
          ? [...prev, animalId]
          : prev.filter(id => id !== animalId)
      );
    } else {
      setSelectedAnimalIds(checked ? [animalId] : []);
    }
  };

  const handleSelectAllAnimals = () => {
    if (selectedAnimalIds.length === availableAnimals.length) {
      setSelectedAnimalIds([]);
    } else {
      setSelectedAnimalIds(availableAnimals.map(animal => animal.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimalIds.length === 0) return;

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const animalId of selectedAnimalIds) {
        const success = await assignAnimal(animalId, lotId, reason, notes);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          selectedAnimalIds.length === 1 
            ? 'Animal asignado exitosamente'
            : `${successCount} animal(es) asignado(s) exitosamente`
        );
      }
      
      if (errorCount > 0) {
        toast.error(`Error al asignar ${errorCount} animal(es)`);
      }

      if (successCount > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Error assigning animals:', error);
      toast.error('Error al asignar los animales');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox 
          id="selectMultiple" 
          checked={selectMultiple}
          onCheckedChange={setSelectMultiple}
        />
        <Label htmlFor="selectMultiple">Seleccionar múltiples animales</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Seleccionar Animal(es) *</Label>
          {selectMultiple && availableAnimals.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllAnimals}
            >
              {selectedAnimalIds.length === availableAnimals.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Button>
          )}
        </div>
        
        {availableAnimals.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 border rounded-md">
            No hay animales disponibles. Todos los animales están asignados a lotes.
          </div>
        ) : selectMultiple ? (
          <div className="border rounded-md max-h-48 overflow-y-auto">
            {availableAnimals.map((animal) => (
              <div key={animal.id} className="flex items-center space-x-2 p-3 border-b last:border-b-0 hover:bg-gray-50">
                <Checkbox
                  id={animal.id}
                  checked={selectedAnimalIds.includes(animal.id)}
                  onCheckedChange={(checked) => handleAnimalSelection(animal.id, checked as boolean)}
                />
                <Label htmlFor={animal.id} className="flex-1 cursor-pointer">
                  {animal.name} - {animal.tag} ({animal.species})
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <Select 
            value={selectedAnimalIds[0] || ''} 
            onValueChange={(value) => setSelectedAnimalIds(value ? [value] : [])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un animal" />
            </SelectTrigger>
            <SelectContent>
              {availableAnimals.map((animal) => (
                <SelectItem key={animal.id} value={animal.id}>
                  {animal.name} - {animal.tag} ({animal.species})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {selectedAnimalIds.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {selectedAnimalIds.length} animal(es) seleccionado(s)
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="reason">Motivo de la Asignación</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Rotación programada, separación por género, etc."
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales sobre esta asignación..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || selectedAnimalIds.length === 0 || availableAnimals.length === 0}
        >
          {isSubmitting ? 'Asignando...' : `Asignar ${selectedAnimalIds.length > 1 ? selectedAnimalIds.length + ' Animales' : 'Animal'}`}
        </Button>
      </div>
    </form>
  );
};

export default AnimalAssignmentForm;
