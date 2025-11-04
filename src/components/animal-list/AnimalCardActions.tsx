
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { actionSheetService } from '@/services/mobile/actionSheetService';
import { hapticService } from '@/services/mobile/hapticService';

interface AnimalCardActionsProps {
  animalId: string;
  animalName: string;
  onDelete: (animalId: string, animalName: string) => void;
}

const AnimalCardActions: React.FC<AnimalCardActionsProps> = ({
  animalId,
  animalName,
  onDelete
}) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    // Try native action sheet first
    if (actionSheetService.isAvailable()) {
      const confirmed = await actionSheetService.showDeleteConfirmation(animalName, 'animal');
      if (confirmed) {
        await hapticService.heavy();
        onDelete(animalId, animalName);
      }
    } else {
      // Fallback to component's own delete flow
      onDelete(animalId, animalName);
    }
  };

  return (
    <div className="flex space-x-1 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/animals/${animalId}`)}
        className="flex-1"
      >
        <Eye className="w-4 h-4 mr-1" />
        Ver
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/animals/${animalId}/edit`)}
        className="flex-1"
      >
        <Edit className="w-4 h-4 mr-1" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="flex-1 text-red-600 hover:text-red-700"
        aria-label={`Eliminar ${animalName}`}
        title={`Eliminar ${animalName}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default AnimalCardActions;
