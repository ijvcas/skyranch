
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BreedingRecord } from '@/services/breedingService';
import BreedingEditForm from '@/components/BreedingEditForm';
import BreedingDetailHeader from '@/components/breeding-detail/BreedingDetailHeader';
import BreedingBasicInfoCard from '@/components/breeding-detail/BreedingBasicInfoCard';
import BreedingPregnancyCard from '@/components/breeding-detail/BreedingPregnancyCard';
import BreedingDatesCard from '@/components/breeding-detail/BreedingDatesCard';
import BreedingAdditionalCard from '@/components/breeding-detail/BreedingAdditionalCard';
import BreedingNotesCard from '@/components/breeding-detail/BreedingNotesCard';
import { useTranslation } from 'react-i18next';

interface BreedingDetailProps {
  record: BreedingRecord;
  animalNames: Record<string, string>;
  onEdit?: (record: BreedingRecord) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
}

const BreedingDetail: React.FC<BreedingDetailProps> = ({ 
  record, 
  animalNames, 
  onEdit, 
  onDelete,
  onBack
}) => {
  const { t } = useTranslation('breeding');
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEditFormSuccess = () => {
    setShowEditForm(false);
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  return (
    <div className="space-y-6">
      <BreedingDetailHeader 
        record={record}
        animalNames={animalNames}
        onEdit={onEdit}
        onDelete={onDelete}
        onBack={onBack}
        onEditClick={handleEditClick}
      />

      {/* Main information cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreedingBasicInfoCard 
          record={record}
          animalNames={animalNames}
        />

        <BreedingPregnancyCard record={record} />

        <BreedingDatesCard record={record} />

        <BreedingAdditionalCard record={record} />
      </div>

      <BreedingNotesCard record={record} />

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editRecord')}</DialogTitle>
          </DialogHeader>
          <BreedingEditForm 
            record={record}
            onSuccess={handleEditFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreedingDetail;
