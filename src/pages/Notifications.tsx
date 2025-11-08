import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import NotificationCenter from '@/components/NotificationCenter';
import { mobilePushService } from '@/services/mobile/pushNotificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('notifications');

  // Clear badge when notifications page is opened
  useEffect(() => {
    const clearBadge = async () => {
      await mobilePushService.clearBadge();
    };
    clearBadge();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            ← {t('backToPanel')}
          </Button>
        </div>

        <NotificationCenter />
      </div>
    </div>
  );
};

export default Notifications;
