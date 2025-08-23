
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { Animal } from '@/stores/animalStore';
import { fetchBreedingRecords } from '@/services/breeding/breedingQueries';

export type FilterType = 'all' | 'healthy' | 'pregnant' | 'sick' | 'treatment' | 'deceased';

interface AnimalListStatsProps {
  animals: Animal[];
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const AnimalListStats = ({ animals, selectedFilter, onFilterChange }: AnimalListStatsProps) => {
  // Fetch breeding records for pregnancy calculation
  const { data: breedingRecords = [] } = useQuery({
    queryKey: ['breeding-records'],
    queryFn: fetchBreedingRecords,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (animals.length === 0) return null;

  // Separate active and deceased animals for proper counting
  const activeAnimals = animals.filter(a => a.lifecycleStatus !== 'deceased');
  const deceasedAnimals = animals.filter(a => a.lifecycleStatus === 'deceased');

  // Helper function to determine if an animal is pregnant using breeding records
  const isAnimalPregnant = (animalId: string) => {
    return breedingRecords.some(record => 
      record.motherId === animalId && 
      (record.pregnancyConfirmed || record.status === 'confirmed_pregnant') &&
      !record.actualBirthDate &&
      record.status !== 'birth_completed'
    );
  };

  const stats = [
    {
      key: 'all' as FilterType,
      count: activeAnimals.length,
      label: 'Total Animales',
      colorClass: 'text-foreground'
    },
    {
      key: 'healthy' as FilterType,
      count: activeAnimals.filter(a => a.healthStatus === 'healthy').length,
      label: 'Saludables',
      colorClass: 'text-green-600'
    },
    {
      key: 'pregnant' as FilterType,
      count: activeAnimals.filter(a => isAnimalPregnant(a.id)).length,
      label: 'Gestantes',
      colorClass: 'text-blue-600'
    },
    {
      key: 'sick' as FilterType,
      count: activeAnimals.filter(a => a.healthStatus === 'sick' || a.healthStatus === 'pregnant-sick').length,
      label: 'Enfermos',
      colorClass: 'text-red-600'
    },
    {
      key: 'treatment' as FilterType,
      count: activeAnimals.filter(a => a.healthStatus === 'treatment').length,
      label: 'En Tratamiento',
      colorClass: 'text-yellow-600'
    },
    {
      key: 'deceased' as FilterType,
      count: deceasedAnimals.length,
      label: 'Fallecidos',
      colorClass: 'text-muted-foreground'
    }
  ];

  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
      {stats.map(stat => (
        <Card 
          key={stat.key}
          className={`shadow-lg cursor-pointer transition-all hover:shadow-xl ${
            selectedFilter === stat.key ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onFilterChange(stat.key)}
        >
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${stat.colorClass}`}>{stat.count}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnimalListStats;
