
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BasicInformationForm from '@/components/animal-edit/BasicInformationForm';
import HealthStatusForm from '@/components/animal-edit/HealthStatusForm';
import PedigreeForm from '@/components/animal-edit/PedigreeForm';
import PhotoUploadForm from '@/components/animal-edit/PhotoUploadForm';

interface AnimalEditFormContainerProps {
  animal: any;
  formData: any;
  updateMutation: any;
  onInputChange: (field: string, value: string) => void;
  onImageChange: (imageUrl: string | null) => void;
  onLocationChange?: (location: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const AnimalEditFormContainer: React.FC<AnimalEditFormContainerProps> = ({
  animal,
  formData,
  updateMutation,
  onInputChange,
  onImageChange,
  onLocationChange,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="page-with-logo">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Animal</h1>
            <p className="text-gray-500">Modifica la información de {animal.name}</p>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <BasicInformationForm 
            formData={formData} 
            onInputChange={onInputChange}
            onLocationChange={onLocationChange}
          />
          
          <HealthStatusForm 
            formData={formData}
            animal={animal}
            onInputChange={onInputChange} 
          />
          
          <PedigreeForm 
            formData={formData} 
            onInputChange={onInputChange}
            animalId={animal.id}
            animalName={animal.name}
          />
          
          <PhotoUploadForm 
            formData={formData} 
            onImageChange={onImageChange} 
          />

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Confirmar Cambios</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending || !formData.name || !formData.species || !formData.tag}
              >
                {updateMutation.isPending ? 'Actualizando...' : 'Actualizar Animal'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AnimalEditFormContainer;
