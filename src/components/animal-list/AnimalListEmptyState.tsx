
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnimalListEmptyStateProps {
  hasAnimals: boolean;
  userEmail?: string;
  onRefresh: () => void;
}

const AnimalListEmptyState = ({ hasAnimals, userEmail, onRefresh }: AnimalListEmptyStateProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['animals', 'common']);

  return (
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('animals:list.noAnimalsFound')}</h3>
      <p className="text-gray-500 mb-6">
        {!hasAnimals 
          ? t('animals:list.noAnimalsInSystem', { email: userEmail })
          : t('animals:list.noAnimalsMatchFilters')
        }
      </p>
      <div className="space-y-2">
        {!hasAnimals && (
          <div>
            <Button onClick={onRefresh} className="bg-blue-600 hover:bg-blue-700 mr-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common:actions.forceRefresh')}
            </Button>
            <Button 
              onClick={() => navigate('/animals/new')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('animals:list.addFirstAnimal')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimalListEmptyState;
