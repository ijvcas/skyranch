
import React, { memo, useMemo } from 'react';
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

// OPTIMIZED: Memoize to prevent unnecessary re-renders
const AnimalCard = memo(({ animal, onDelete }: AnimalCardProps) => {
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

  // OPTIMIZED: Memoize computed values
  const isDeceased = useMemo(() => animal.lifecycleStatus === 'deceased', [animal.lifecycleStatus]);
  const isSold = useMemo(() => animal.lifecycleStatus === 'sold', [animal.lifecycleStatus]);
  const statusColor = useMemo(() => 
    getStatusColor(isDeceased ? 'deceased' : animal.healthStatus),
    [isDeceased, animal.healthStatus]
  );
  const statusText = useMemo(() => 
    getStatusText(isDeceased ? 'deceased' : animal.healthStatus),
    [isDeceased, animal.healthStatus]
  );
  
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
          <Badge className={statusColor}>
            {statusText}
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
        {isSold && (
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
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - only re-render if animal data actually changed
  return (
    prevProps.animal.id === nextProps.animal.id &&
    prevProps.animal.name === nextProps.animal.name &&
    prevProps.animal.lifecycleStatus === nextProps.animal.lifecycleStatus &&
    prevProps.animal.healthStatus === nextProps.animal.healthStatus &&
    prevProps.animal.image === nextProps.animal.image
  );
});

AnimalCard.displayName = 'AnimalCard';

export default AnimalCard;
