import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, Phone } from 'lucide-react';
import { supportSettingsService } from '@/services/supportSettingsService';
import { useTranslation } from 'react-i18next';

const DashboardSupportInfo = () => {
  const { t } = useTranslation('dashboard');
  const [supportInfo, setSupportInfo] = useState({
    email: 'soporte@farmika.app',
    phone: '+34636391352',
    hours: 'Lunes a Viernes 8:00 AM - 6:00 PM'
  });

  useEffect(() => {
    const loadSupportInfo = async () => {
      try {
        const data = await supportSettingsService.getSupportSettings();
        if (data) {
          setSupportInfo({
            email: data.email,
            phone: data.phone,
            hours: data.hours
          });
        }
      } catch (error) {
        console.error('Error loading support info:', error);
        // Keep default values
      }
    };
    
    loadSupportInfo();
  }, []);

  const handleContactSupport = () => {
    window.open(`mailto:${supportInfo.email}`, '_blank');
  };

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-600" />
          {t('support.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-gray-500" />
          <span>{supportInfo.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gray-500" />
          <span>{supportInfo.phone}</span>
        </div>
        <div className="text-sm">
          <strong>{t('support.schedule')}:</strong> {supportInfo.hours}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleContactSupport}
        >
          {t('support.contactSupport')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DashboardSupportInfo;
