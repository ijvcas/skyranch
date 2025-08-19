import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addAnimal } from '@/services/animal/animalMutations';
import { Heart, Save, X } from 'lucide-react';

interface AddAnimalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddAnimalDialog: React.FC<AddAnimalDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    species: 'bovino',
    breed: '',
    gender: '',
    birthDate: '',
    weight: '',
    color: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del animal es requerido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🐄 ADD_ANIMAL: Creating animal with data:', formData);
      
      const animalData = {
        name: formData.name.trim(),
        tag: formData.tag.trim(),
        species: formData.species,
        breed: formData.breed.trim(),
        gender: formData.gender || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight.trim(),
        color: formData.color.trim(),
        notes: formData.notes.trim(),
        healthStatus: 'healthy' as const,
        lifecycleStatus: 'active' as const,
        image: null,
        motherId: '',
        fatherId: ''
      };

      const success = await addAnimal(animalData);
      
      if (success) {
        toast({
          title: "¡Éxito!",
          description: "Animal agregado correctamente",
        });
        
        // Reset form
        setFormData({
          name: '',
          tag: '',
          species: 'bovino',
          breed: '',
          gender: '',
          birthDate: '',
          weight: '',
          color: '',
          notes: ''
        });
        
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error('Failed to add animal');
      }
    } catch (error) {
      console.error('❌ ADD_ANIMAL: Error:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el animal. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tag: '',
      species: 'bovino',
      breed: '',
      gender: '',
      birthDate: '',
      weight: '',
      color: '',
      notes: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Agregar Nuevo Animal
          </DialogTitle>
          <DialogDescription>
            Completa la información básica del animal. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del animal"
                required
              />
            </div>

            {/* Tag */}
            <div>
              <Label htmlFor="tag">Etiqueta/ID</Label>
              <Input
                id="tag"
                value={formData.tag}
                onChange={(e) => handleInputChange('tag', e.target.value)}
                placeholder="Ej: 001, A123"
              />
            </div>

            {/* Species */}
            <div>
              <Label htmlFor="species">Especie *</Label>
              <Select value={formData.species} onValueChange={(value) => handleInputChange('species', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona especie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bovino">Bovino</SelectItem>
                  <SelectItem value="ovino">Ovino</SelectItem>
                  <SelectItem value="caprino">Caprino</SelectItem>
                  <SelectItem value="porcino">Porcino</SelectItem>
                  <SelectItem value="equino">Equino</SelectItem>
                  <SelectItem value="ave">Ave</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div>
              <Label htmlFor="breed">Raza</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
                placeholder="Raza del animal"
              />
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender">Sexo</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div>
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="0.0"
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Color del animal"
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Información adicional sobre el animal..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Agregar Animal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAnimalDialog;