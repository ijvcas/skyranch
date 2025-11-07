
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardErrorStateProps {
  userEmail?: string;
  onForceRefresh: () => void;
  onSignOut: () => void;
}

const DashboardErrorState = ({ userEmail, onForceRefresh, onSignOut }: DashboardErrorStateProps) => {
  const { t } = useTranslation('dashboard');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center pt-16">
      <div className="text-center max-w-md mx-auto p-6">
        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <div className="text-lg text-orange-600 mb-4">{t('error.title')}</div>
        <div className="text-sm text-gray-600 mb-4">
          {t('error.user')}: {userEmail}
        </div>
        <div className="text-sm text-gray-600 mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
          {t('error.description')}
        </div>
        <div className="space-y-3">
          <Button onClick={onForceRefresh} className="bg-blue-600 hover:bg-blue-700 w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('error.retry')}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            {t('error.reload')}
          </Button>
          <Button onClick={onSignOut} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            {t('error.signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardErrorState;
