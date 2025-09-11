
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAnimalFiltering } from '@/hooks/useAnimalFiltering';
import PageLayout from '@/components/ui/page-layout';
import LoadingState from '@/components/ui/loading-state';
import ErrorState from '@/components/ui/error-state';
import AnimalListHeader from '@/components/animal-list/AnimalListHeader';
import AnimalListFilters from '@/components/animal-list/AnimalListFilters';
import AnimalSpeciesGroup from '@/components/animal-list/AnimalSpeciesGroup';
import AnimalListEmptyState from '@/components/animal-list/AnimalListEmptyState';
import AnimalListStats, { FilterType } from '@/components/animal-list/AnimalListStats';
import AnimalDeleteDialog from '@/components/AnimalDeleteDialog';
import { useInfiniteAnimals } from '@/hooks/useInfiniteAnimals';

const AnimalList = () => {
  console.log('🔧 AnimalList component starting...');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  // Check if we should expand a specific species section
  const shouldExpand = searchParams.get('expand') === 'true';
  const targetSpecies = searchParams.get('species');
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    animalId: string;
    animalName: string;
  }>({
    isOpen: false,
    animalId: '',
    animalName: ''
  });
  
  const [useMockData, setUseMockData] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  
  // Infinite animals with lightweight pages - always fetch both active and deceased
  const {
    animals = [],
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    clearAndRefetch,
    isUsingMock,
  } = useInfiniteAnimals();

  console.log('🔧 About to call useAnimalFiltering with animals:', animals?.length);
  const {
    searchTerm,
    setSearchTerm,
    selectedSpecies,
    setSelectedSpecies,
    selectedStatus,
    setSelectedStatus,
    groupedAnimals
  } = useAnimalFiltering(animals, selectedFilter);

  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing animal list...');
    setUseMockData(false);
    clearAndRefetch();
    toast({
      title: "Actualizando lista",
      description: "Recargando animales...",
    });
  };

  const handleDeleteClick = (animalId: string, animalName: string) => {
    setDeleteDialog({
      isOpen: true,
      animalId,
      animalName
    });
  };

  if (isLoading) {
    return <LoadingState message="Cargando animales..." userEmail={user?.email} />;
  }

  if (error) {
    console.error('Error loading animals:', error);
    return (
      <ErrorState
        title="Error al cargar animales"
        message="Ocurrió un error al cargar la lista de animales."
        userEmail={user?.email}
        onRetry={handleForceRefresh}
        onReload={() => window.location.reload()}
      />
    );
  }

  return (
    <PageLayout className="px-2 pt-4 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto">
        {(useMockData || isUsingMock) && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm">
              ⚠️ Modo de demostración activo - Mostrando datos de ejemplo debido a problemas de conexión
            </p>
          </div>
        )}

        <AnimalListHeader
          userEmail={user?.email}
          totalAnimals={animals.length}
          onRefresh={handleForceRefresh}
        />

        <AnimalListFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedSpecies={selectedSpecies}
          onSpeciesChange={setSelectedSpecies}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {Object.keys(groupedAnimals).length === 0 ? (
          <AnimalListEmptyState
            hasAnimals={animals.length > 0}
            userEmail={user?.email}
            onRefresh={handleForceRefresh}
          />
        ) : (
          <div className="space-y-6 mt-8">
            {Object.entries(groupedAnimals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([species, speciesAnimals]) => (
                <AnimalSpeciesGroup
                  key={species}
                  species={species}
                  animals={speciesAnimals}
                  onDeleteAnimal={handleDeleteClick}
                  initialExpanded={shouldExpand && species === targetSpecies}
                />
              ))}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
                >
                  {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        )}

        <AnimalListStats 
          animals={animals} 
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </div>

      <AnimalDeleteDialog
        animalId={deleteDialog.animalId}
        animalName={deleteDialog.animalName}
        isOpen={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}
      />
    </PageLayout>
  );
};

export default AnimalList;
