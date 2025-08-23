
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Animal } from '@/stores/animalStore';
import { fetchBreedingRecords } from '@/services/breeding/breedingQueries';
import type { FilterType } from '@/components/animal-list/AnimalListStats';

export const useAnimalFiltering = (animals: Animal[], selectedFilter: FilterType) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch breeding records to determine pregnancy status
  const { data: breedingRecords = [] } = useQuery({
    queryKey: ['breeding-records'],
    queryFn: fetchBreedingRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function to determine if an animal is pregnant
  const isAnimalPregnant = (animalId: string) => {
    return breedingRecords.some(record => 
      record.motherId === animalId && 
      (record.pregnancyConfirmed || record.status === 'confirmed_pregnant') &&
      !record.actualBirthDate &&
      record.status !== 'birth_completed'
    );
  };

  // Helper function to get the computed status of an animal
  const getComputedStatus = (animal: Animal) => {
    const isPregnant = isAnimalPregnant(animal.id);
    const baseStatus = animal.healthStatus || 'healthy';
    
    if (isPregnant) {
      switch (baseStatus) {
        case 'healthy':
          return 'pregnant-healthy';
        case 'sick':
          return 'pregnant-sick';
        default:
          return 'pregnant';
      }
    }
    
    return baseStatus;
  };

  const groupedAnimals = useMemo(() => {
    const filtered = animals.filter(animal => {
      const matchesSearch = 
        animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.tag.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecies = selectedSpecies === 'all' || animal.species === selectedSpecies;
      
      // Filter based on selectedFilter from statistics cards
      const isDeceased = animal.lifecycleStatus === 'deceased';
      
      // Apply filter based on selected statistic card
      let matchesFilter = true;
      switch (selectedFilter) {
        case 'all':
          matchesFilter = !isDeceased; // Only active animals
          break;
        case 'healthy':
          matchesFilter = !isDeceased && animal.healthStatus === 'healthy';
          break;
        case 'pregnant':
          const computedStatus = getComputedStatus(animal);
          matchesFilter = !isDeceased && (computedStatus === 'pregnant' || computedStatus === 'pregnant-healthy' || computedStatus === 'pregnant-sick');
          break;
        case 'sick':
          matchesFilter = !isDeceased && (animal.healthStatus === 'sick' || animal.healthStatus === 'pregnant-sick');
          break;
        case 'treatment':
          matchesFilter = !isDeceased && animal.healthStatus === 'treatment';
          break;
        case 'deceased':
          matchesFilter = isDeceased; // Only deceased animals
          break;
        default:
          matchesFilter = !isDeceased;
      }
      
      // Enhanced status matching with pregnancy computation (for the status filter dropdown)
      const computedStatus = getComputedStatus(animal);
      const matchesStatus = selectedStatus === 'all' || 
        computedStatus === selectedStatus ||
        // Also match base pregnancy status for any pregnant-* selection
        (selectedStatus === 'pregnant' && computedStatus.startsWith('pregnant'));
      
      return matchesSearch && matchesSpecies && matchesStatus && matchesFilter;
    });

    // Group by species
    const grouped = filtered.reduce((acc, animal) => {
      const species = animal.species || 'otros';
      if (!acc[species]) {
        acc[species] = [];
      }
      acc[species].push(animal);
      return acc;
    }, {} as Record<string, typeof animals>);

    // Sort animals within each species by name
    Object.keys(grouped).forEach(species => {
      grouped[species].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [animals, searchTerm, selectedSpecies, selectedStatus, breedingRecords, selectedFilter]);

  return {
    searchTerm,
    setSearchTerm,
    selectedSpecies,
    setSelectedSpecies,
    selectedStatus,
    setSelectedStatus,
    groupedAnimals
  };
};
