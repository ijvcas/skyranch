
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skull, DollarSign } from 'lucide-react';
import { getStatusColor, getStatusText } from '@/utils/animalStatus';
import { useImageTransform } from './hooks/useImageTransform';
import AnimalImageEditor from './AnimalImageEditor';
import AnimalInfo from './AnimalInfo';
import AnimalCardActions from './AnimalCardActions';
import type { Animal } from '@/stores/animalStore';

interface AnimalCardProps {
  animal: Animal;
  onDelete: (animalId: string, animalName: string) => void;
}

const AnimalCard = ({ animal, onDelete }: AnimalCardProps) => {
  const {
    isEditMode,
    currentTransform,
    savedTransform,
    displayTransform,
    updateMutation,
    handleImageTransform,
    handleSaveImage,
    handleEditClick,
    handleCancelEdit
  } = useImageTransform(animal);

  const isDeceased = animal.lifecycleStatus === 'deceased';
  
  return (
    <Card className={`shadow hover:shadow-lg transition-shadow ${isDeceased ? 'bg-gray-50 border-gray-300 opacity-90' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={`text-lg ${isDeceased ? 'text-gray-600' : 'text-gray-900'}`}>
                  {animal.name}
                </CardTitle>
                {isDeceased && (
                  <Skull className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <p className={`text-sm ${isDeceased ? 'text-gray-500' : 'text-gray-600'}`}>#{animal.tag}</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(isDeceased ? 'deceased' : animal.healthStatus)}`}>
            {getStatusText(isDeceased ? 'deceased' : animal.healthStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <AnimalImageEditor
          animal={animal}
          isEditMode={isEditMode}
          currentTransform={currentTransform}
          savedTransform={savedTransform}
          displayTransform={displayTransform}
          updateMutationPending={updateMutation.isPending}
          onImageTransform={handleImageTransform}
          onEditClick={handleEditClick}
          onSaveImage={handleSaveImage}
          onCancelEdit={handleCancelEdit}
        />
        
        {/* Sold animal indicator */}
        {animal.lifecycleStatus === 'sold' && (
          <div className="absolute top-2 right-2">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        )}
        
        <AnimalInfo animal={animal} />
        
        <AnimalCardActions
          animalId={animal.id}
          animalName={animal.name}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
};

export default AnimalCard;
