
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusText } from '@/utils/animalStatus';
import { useImageTransform } from '@/components/animal-list/hooks/useImageTransform';
import { useTimezone } from '@/hooks/useTimezone';
import AnimalImageEditor from '@/components/animal-list/AnimalImageEditor';
import { useAnimalNames } from '@/hooks/useAnimalNames';
import { format } from 'date-fns';
import type { Animal } from '@/stores/animalStore';

interface AnimalBasicInfoProps {
  animal: Animal;
}

const AnimalBasicInfo: React.FC<AnimalBasicInfoProps> = ({ animal }) => {
  const { formatDateInput } = useTimezone();
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

  // Filter out ALL image transform related data from notes
  const getFilteredNotes = (notes: string | null) => {
    if (!notes) return '';
    return notes
      .replace(/\[Image Transform Data: .*?\]\n?/g, '')
      .replace(/\[Image Transform Applied: .*?\]\n?/g, '')
      .replace(/Image Transform Applied: .*?\n?/g, '')
      .trim();
  };

const filteredNotes = getFilteredNotes(animal.notes);

const { getDisplayName } = useAnimalNames();
const computeDerivedNotes = () => {
  const raw = filteredNotes;
  if (!raw) return '';
  if (raw.toLowerCase().includes('registro de apareamiento')) {
    const motherName = getDisplayName(animal.motherId) || animal.motherId || 'madre desconocida';
    let dateStr = '';
    if (animal.birthDate) {
      try { dateStr = format(new Date(animal.birthDate), 'dd/MM/yyyy'); } catch { dateStr = String(animal.birthDate); }
    }
    return `Creado automáticamente desde parto de ${motherName}${dateStr ? ' el ' + dateStr : ''}`;
  }
  return raw;
};
const finalNotes = computeDerivedNotes();

// Format the birth date using the timezone settings
const formatBirthDate = (birthDate: string) => {
  if (!birthDate) return 'No especificada';
  return formatDateInput(birthDate);
};

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Información Básica
          <Badge className={`${getStatusColor(animal.healthStatus)}`}>
            {getStatusText(animal.healthStatus)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Especie</label>
            <p className="text-gray-900">{animal.species}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Raza</label>
            <p className="text-gray-900">{animal.breed || 'No especificada'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Género</label>
            <p className="text-gray-900">{animal.gender}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Fecha de Nacimiento</label>
            <p className="text-gray-900">{formatBirthDate(animal.birthDate)}</p>
          </div>
          {animal.lifecycleStatus === 'deceased' && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Fallecimiento</label>
                <p className="text-gray-900">{animal.dateOfDeath ? formatBirthDate(animal.dateOfDeath) : 'No registrada'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Causa</label>
                <p className="text-gray-900">{animal.causeOfDeath || 'No registrada'}</p>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Peso</label>
            <p className="text-gray-900">{animal.weight} kg</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Color</label>
            <p className="text-gray-900">{animal.color}</p>
          </div>
        </div>

{finalNotes && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600">Notas</label>
            <p className="text-gray-700 whitespace-pre-wrap mt-1">{finalNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimalBasicInfo;
