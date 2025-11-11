import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAnimal } from '@/services/animalService';
import { checkPermission } from '@/services/permissionService';
import PermissionGuard from '@/components/PermissionGuard';
import BasicInformationForm from '@/components/animal-edit/BasicInformationForm';
import HealthStatusForm from '@/components/animal-edit/HealthStatusForm';
import PedigreeForm from '@/components/animal-edit/PedigreeForm';
import PhotoUploadForm from '@/components/animal-edit/PhotoUploadForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

const AnimalForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { scanBarcode, isScanning } = useBarcodeScanner();
  
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    gender: '',
    tag: '',
    birthDate: '',
    weight: '',
    color: '',
    healthStatus: 'healthy',
    notes: '',
    image: null as string | null,
    location: null as any,
    // Pedigree data
    motherId: '',
    fatherId: '',
    maternalGrandmotherId: '',
    maternalGrandfatherId: '',
    paternalGrandmotherId: '',
    paternalGrandfatherId: '',
    maternalGreatGrandmotherMaternalId: '',
    maternalGreatGrandfatherMaternalId: '',
    maternalGreatGrandmotherPaternalId: '',
    maternalGreatGrandfatherPaternalId: '',
    paternalGreatGrandmotherMaternalId: '',
    paternalGreatGrandfatherMaternalId: '',
    paternalGreatGrandmotherPaternalId: '',
    paternalGreatGrandfatherPaternalId: ''
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check permission before creating
      console.log('🔍 Checking animals_create permission...');
      await checkPermission('animals_create');
      console.log('✅ Permission granted for animal creation');
      
      return createAnimal(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast({
        title: "Animal Creado",
        description: `${formData.name} ha sido registrado exitosamente.`,
      });
      navigate('/animals');
    },
    onError: (error: any) => {
      console.error('❌ Error creating animal:', error);
      
      if (error.message?.includes('Acceso denegado')) {
        setPermissionError(error.message);
        toast({
          title: "Sin Permisos",
          description: "No tienes permisos para crear animales.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el animal.",
          variant: "destructive"
        });
      }
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
  };

  const handleLocationChange = (location: any) => {
    setFormData(prev => ({ ...prev, location }));
  };

  const handleScanBarcode = async () => {
    const result = await scanBarcode();
    if (result && result.type === 'animal') {
      setFormData(prev => ({ ...prev, tag: result.id }));
      toast({
        title: 'Barcode Scanned',
        description: `Tag number set to: ${result.id}`,
      });
    } else if (result) {
      toast({
        title: 'Invalid Scan',
        description: 'This barcode is not linked to an animal tag',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionError(null);
    
    if (!formData.name || !formData.species || !formData.tag) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa nombre, especie y etiqueta.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Submitting animal creation form:', formData);
    createMutation.mutate(formData);
  };

  if (permissionError) {
    return (
      <div className="page-with-logo">
        <div className="container mx-auto py-6">
          <Alert className="border-red-200 bg-red-50 max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {permissionError}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate('/animals')} variant="outline">
              Volver a Animales
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="animals_create">
      <div className="page-with-logo">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Registrar Nuevo Animal</h1>
              <p className="text-gray-500">Ingresa la información del animal</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/animals')}
            >
              Cancelar
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <BasicInformationForm 
              formData={formData} 
              onInputChange={handleInputChange}
              onLocationChange={handleLocationChange}
              onScanBarcode={handleScanBarcode}
              isScanning={isScanning}
            />
            
            <HealthStatusForm 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
            
            <PedigreeForm 
              formData={formData} 
              onInputChange={handleInputChange} 
            />
            
            <PhotoUploadForm 
              formData={formData} 
              onImageChange={handleImageChange} 
            />

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Confirmar Registro</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/animals')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || !formData.name || !formData.species || !formData.tag}
                >
                  {createMutation.isPending ? 'Creando...' : 'Registrar Animal'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AnimalForm;
