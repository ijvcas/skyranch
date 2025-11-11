
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus } from 'lucide-react';
import QuickLogDialog from '@/components/activities/QuickLogDialog';
import { useTranslation } from 'react-i18next';

const FieldReportButton = () => {
  const { t } = useTranslation('tasks');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold px-4 md:px-6 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl w-full md:w-auto flex items-center justify-center gap-2"
      >
        <ClipboardCheck className="w-4 md:w-5 h-4 md:h-5" />
        <span className="text-sm md:text-base">{t('fieldTask')}</span>
        <Plus className="w-3 md:w-4 h-3 md:h-4" />
      </Button>
      
      <QuickLogDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
};

export default FieldReportButton;
