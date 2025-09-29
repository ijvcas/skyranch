import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Animal } from '@/stores/animalStore';

export type FilterType = 'all' | 'healthy' | 'pregnant' | 'sick' | 'sold' | 'deceased';

// Optimized animal filtering with memoization and performance improvements
export const useOptimizedAnimalFiltering = (animals: Animal[], selectedFilter: FilterType) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch breeding records only when needed (pregnancy filter)
  const { data: breedingRecords = [] } = useQuery({
    queryKey: ['breeding-records', 'pregnancy-check'],
    queryFn: async () => {
      const { data } = await supabase
        .from('breeding_records')
        .select('mother_id, pregnancy_confirmed, status')
        .eq('pregnancy_confirmed', true)
        .in('status', ['confirmed', 'in_progress']);
      return data || [];
    },
    enabled: selectedFilter === 'pregnant' || selectedFilter === 'all',
    staleTime: 5 * 60_000, // 5 minutes cache
    gcTime: 10 * 60_000,
  });

  // Memoized pregnancy check for better performance
  const pregnantAnimalIds = useMemo(() => {
    return new Set(breedingRecords.map(record => record.mother_id));
  }, [breedingRecords]);

  const isAnimalPregnant = (animalId: string) => pregnantAnimalIds.has(animalId);

  // Optimized computed status with memoization
  const getComputedStatus = useMemo(() => {
    const cache = new Map<string, string>();
    
    return (animal: Animal): string => {
      const cacheKey = `${animal.id}-${animal.healthStatus}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }

      let status = animal.healthStatus || 'healthy';
      
      // Check for pregnancy status
      if (isAnimalPregnant(animal.id)) {
        status = status === 'healthy' ? 'pregnant-healthy' : `pregnant-${status}`;
      }

      cache.set(cacheKey, status);
      return status;
    };
  }, [pregnantAnimalIds]);

  // Highly optimized filtering with multiple memoization levels
  const groupedAnimals = useMemo(() => {
    // Early return for empty state
    if (!animals.length) return {};

    // Pre-compile filter conditions for better performance
    const searchLower = searchTerm.toLowerCase();
    const hasSearch = searchTerm.length > 0;
    const hasSpeciesFilter = selectedSpecies.length > 0;
    const hasStatusFilter = selectedStatus.length > 0;

    // Filter animals with optimized conditions
    const filtered = animals.filter(animal => {
      // Fast search filter (most restrictive first)
      if (hasSearch) {
        const matchesSearch = 
          animal.name?.toLowerCase().includes(searchLower) ||
          animal.tag?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Species filter
      if (hasSpeciesFilter && animal.species !== selectedSpecies) return false;

      // Status filter
      if (hasStatusFilter) {
        const computedStatus = getComputedStatus(animal);
        if (computedStatus !== selectedStatus) return false;
      }

      // Filter type (from stats cards)
      switch (selectedFilter) {
        case 'healthy':
          return animal.healthStatus === 'healthy' && !isAnimalPregnant(animal.id);
        case 'pregnant':
          return isAnimalPregnant(animal.id);
        case 'sick':
          return (animal.healthStatus === 'sick' || animal.healthStatus === 'pregnant-sick') && !isAnimalPregnant(animal.id);
        case 'sold':
          return animal.lifecycleStatus === 'sold';
        case 'deceased':
          return animal.lifecycleStatus === 'deceased';
        default:
          return animal.lifecycleStatus !== 'deceased';
      }
    });

    // Group by species with optimized grouping
    const grouped = filtered.reduce((groups, animal) => {
      const species = animal.species || 'unknown';
      if (!groups[species]) {
        groups[species] = [];
      }
      groups[species].push(animal);
      return groups;
    }, {} as Record<string, Animal[]>);

    // Sort each group by name for consistent display
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    return grouped;
  }, [animals, searchTerm, selectedSpecies, selectedStatus, selectedFilter, getComputedStatus, pregnantAnimalIds]);

  return {
    searchTerm,
    setSearchTerm,
    selectedSpecies,
    setSelectedSpecies,
    selectedStatus,
    setSelectedStatus,
    groupedAnimals,
  };
};