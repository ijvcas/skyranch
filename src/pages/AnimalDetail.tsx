
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Activity, Wrench } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAnimal } from '@/services/animalService';
import AnimalDeleteDialog from '@/components/AnimalDeleteDialog';
import HorizontalPedigreeTree from '@/components/HorizontalPedigreeTree';
import PedigreeDiagnostics from '@/components/PedigreeDiagnostics';
import PedigreePDFViewer from '@/components/pedigree/PedigreePDFViewer';
import AnimalBasicInfo from '@/components/animal-detail/AnimalBasicInfo';
import AnimalSidebar from '@/components/animal-detail/AnimalSidebar';
import AnimalHealthRecords from '@/components/animal-detail/AnimalHealthRecords';
import AnimalHistory from '@/components/animal-detail/AnimalHistory';

const AnimalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: animal, isLoading: isLoadingAnimal } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimal(id!),
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">ID de animal no válido</div>
      </div>
    );
  }

  if (isLoadingAnimal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando información del animal...</div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Animal no encontrado</h2>
          <p className="text-gray-600 mb-6">El animal solicitado no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => navigate('/animals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/animals')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Animales
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {animal.name}
              </h1>
              <p className="text-gray-600">ID: #{animal.tag}</p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                onClick={() => navigate(`/animals/${animal.id}/edit`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 h-auto">
                <TabsTrigger value="general" className="w-full">Información General</TabsTrigger>
                <TabsTrigger value="health" className="w-full">
                  <Activity className="w-4 h-4 mr-2" />
                  Salud
                </TabsTrigger>
                <TabsTrigger value="pedigree" className="w-full">Pedigrí</TabsTrigger>
                <TabsTrigger value="diagnostics" className="w-full">
                  <Wrench className="w-4 h-4 mr-2" />
                  Diagnóstico
                </TabsTrigger>
                <TabsTrigger value="history" className="w-full">Historial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                {/* Basic Information - Notes are included here */}
                <AnimalBasicInfo animal={animal} />
              </TabsContent>

              <TabsContent value="health">
                <AnimalHealthRecords 
                  animalId={animal.id} 
                  animalName={animal.name} 
                />
              </TabsContent>

              <TabsContent value="pedigree">
                {animal.species === 'equino' ? (
                  <PedigreePDFViewer animal={animal} />
                ) : (
                  <HorizontalPedigreeTree animal={animal} />
                )}
              </TabsContent>

              <TabsContent value="diagnostics">
                <PedigreeDiagnostics animal={animal} />
              </TabsContent>

              <TabsContent value="history">
                <AnimalHistory animal={animal} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <AnimalSidebar animal={animal} />
        </div>
      </div>

      {/* Delete Dialog */}
      <AnimalDeleteDialog
        animalId={animal.id}
        animalName={animal.name}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        redirectAfterDelete={true}
      />
    </div>
  );
};

export default AnimalDetail;
