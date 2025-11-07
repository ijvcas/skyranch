
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserManagementHeaderProps {
  onToggleAddForm: () => void;
}

const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  onToggleAddForm
}) => {
  const { t } = useTranslation('users');
  
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-center">
          <Users className="w-5 h-5 mr-2" />
          {t('management.title')}
        </h3>
        <p className="text-sm text-gray-600">{t('management.description')}</p>
      </div>
      <Button
        onClick={onToggleAddForm}
        className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
        size="sm"
      >
        <Share2 className="w-4 h-4" />
        {t('management.inviteByEmail')}
      </Button>
    </div>
  );
};

export default UserManagementHeader;
