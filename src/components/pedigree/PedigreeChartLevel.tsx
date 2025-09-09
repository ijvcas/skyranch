
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PedigreeChartLevelProps {
  animals: Array<{
    id?: string;
    label: string;
    gender?: 'male' | 'female';
  }>;
  getDisplayName: (id?: string) => string | null;
  animalNamesMap: Record<string, string>;
  isValidUUID: (str: string) => boolean;
  gridCols: string;
}

const PedigreeChartLevel = ({ 
  animals, 
  getDisplayName, 
  animalNamesMap, 
  isValidUUID, 
  gridCols 
}: PedigreeChartLevelProps) => {
  const navigate = useNavigate();

  const AnimalCard = ({ id, label, gender }: { id?: string; label: string; gender?: 'male' | 'female' }) => {
    const name = getDisplayName(id);
    const isRegisteredAnimal = id && isValidUUID(id) && animalNamesMap[id];
    
    // Debug logging for parent resolution
    if (id && label.includes('Madre') || label.includes('Padre')) {
      console.log(`🔍 Pedigree Debug - ${label}:`, {
        id,
        name,
        isValidUUID: isValidUUID(id),
        inAnimalNamesMap: !!animalNamesMap[id],
        animalNamesMapEntry: animalNamesMap[id],
        animalNamesMapKeys: Object.keys(animalNamesMap).slice(0, 3) // First 3 keys for debugging
      });
    }
    
    if (!name || name === id) {
      return (
        <div className="p-2 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 text-xs">
          {label}
          <br />
          <span className="text-xs">
            {id && isValidUUID(id) ? 'Cargando...' : 'No registrado'}
          </span>
        </div>
      );
    }

    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-2">
          <div className="text-center">
            <div className="flex items-center justify-between mb-1">
              <Badge variant={gender === 'male' ? 'default' : 'secondary'} className="text-xs">
                {gender === 'male' ? '♂' : gender === 'female' ? '♀' : '?'}
              </Badge>
              {isRegisteredAnimal && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/animals/${id}`)}
                  className="h-5 w-5 p-0"
                >
                  <Eye className="w-2 h-2" />
                </Button>
              )}
            </div>
            <div className="font-medium text-xs truncate">{name}</div>
            <div className="text-xs text-gray-500">{label}</div>
            {!isRegisteredAnimal && (
              <div className="text-xs text-blue-600 mt-1">Externo</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`grid ${gridCols} gap-1`}>
      {animals.map((animal, index) => (
        <AnimalCard 
          key={index}
          id={animal.id} 
          label={animal.label} 
          gender={animal.gender} 
        />
      ))}
    </div>
  );
};

export default PedigreeChartLevel;
