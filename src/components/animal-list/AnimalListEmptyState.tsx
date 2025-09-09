
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw } from 'lucide-react';

interface AnimalListEmptyStateProps {
  hasAnimals: boolean;
  userEmail?: string;
  onRefresh: () => void;
}

const AnimalListEmptyState = ({ hasAnimals, userEmail, onRefresh }: AnimalListEmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron animales</h3>
      <p className="text-gray-500 mb-6">
        {!hasAnimals 
          ? `No hay animales registrados en el sistema para mostrar a ${userEmail}.`
          : "No hay animales que coincidan con los filtros seleccionados."
        }
      </p>
      <div className="space-y-2">
        {!hasAnimals && (
          <div>
            <Button onClick={onRefresh} className="bg-blue-600 hover:bg-blue-700 mr-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Forzar Actualización
            </Button>
            <Button 
              onClick={() => navigate('/animals/new')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Animal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimalListEmptyState;
