
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Info, HelpCircle, Mail, Phone } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface AppInfoFormProps {
  isAdmin: boolean;
}

const AppInfoForm = ({ isAdmin }: AppInfoFormProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  console.log('AppInfoForm - isAdmin:', isAdmin); // Debug log
  
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isEditingSupport, setIsEditingSupport] = useState(false);
  
  const [appInfo, setAppInfo] = useState({
    version: 'SkyRanch v1.2.0',
    lastUpdate: 'Enero 2025',
    build: '2025.01.05',
    admin: 'Juan Casanova H',
    description: 'Sistema de gestión ganadera completo'
  });
  
  const [supportInfo, setSupportInfo] = useState({
    email: 'soporte@skyranch.com',
    phone: '+1 (555) 123-4567',
    hours: 'Lunes a Viernes 8:00 AM - 6:00 PM'
  });

  const [tempAppInfo, setTempAppInfo] = useState(appInfo);
  const [tempSupportInfo, setTempSupportInfo] = useState(supportInfo);

  const handleSaveApp = () => {
    setAppInfo(tempAppInfo);
    setIsEditingApp(false);
    toast({
      title: t('settings:farmProfile.infoUpdated'),
      description: t('settings:farmProfile.infoUpdatedDesc'),
    });
  };

  const handleSaveSupport = () => {
    setSupportInfo(tempSupportInfo);
    setIsEditingSupport(false);
    toast({
      title: t('settings:farmProfile.infoUpdated'),
      description: t('settings:farmProfile.infoUpdatedDesc'),
    });
  };

  const handleCancelAppEdit = () => {
    setTempAppInfo(appInfo);
    setIsEditingApp(false);
  };

  const handleCancelSupportEdit = () => {
    setTempSupportInfo(supportInfo);
    setIsEditingSupport(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* App Version Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            {t('settings:farmProfile.appInfo')}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingApp(!isEditingApp)}
                className="ml-auto bg-blue-50 hover:bg-blue-100"
                title={t('settings:farmProfile.edit')}
                aria-label={isEditingApp ? t('settings:farmProfile.closeEdit') : t('settings:farmProfile.edit')}
              >
                {isEditingApp ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingApp ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="app-version">{t('settings:farmProfile.version')}</Label>
                <Input
                  id="app-version"
                  value={tempAppInfo.version}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, version: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-update">{t('settings:farmProfile.lastUpdate')}</Label>
                <Input
                  id="app-update"
                  value={tempAppInfo.lastUpdate}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, lastUpdate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-build">{t('settings:farmProfile.build')}</Label>
                <Input
                  id="app-build"
                  value={tempAppInfo.build}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, build: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-admin">{t('settings:farmProfile.admin')}</Label>
                <Input
                  id="app-admin"
                  value={tempAppInfo.admin}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, admin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-description">{t('settings:farmProfile.description')}</Label>
                <Textarea
                  id="app-description"
                  value={tempAppInfo.description}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveApp}>
                  <Save className="w-4 h-4 mr-1" />
                  {t('common:save')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelAppEdit}>
                  {t('common:cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.version')}:</strong> {appInfo.version}
              </div>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.lastUpdate')}:</strong> {appInfo.lastUpdate}
              </div>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.build')}:</strong> {appInfo.build}
              </div>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.admin')}:</strong> {appInfo.admin}
              </div>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.description')}:</strong> {appInfo.description}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            {t('settings:farmProfile.support')}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSupport(!isEditingSupport)}
                className="ml-auto bg-orange-50 hover:bg-orange-100"
                title={t('settings:farmProfile.edit')}
                aria-label={isEditingSupport ? t('settings:farmProfile.closeEdit') : t('settings:farmProfile.edit')}
              >
                {isEditingSupport ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingSupport ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="support-email">{t('settings:farmProfile.supportEmail')}</Label>
                <Input
                  id="support-email"
                  value={tempSupportInfo.email}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="support-phone">{t('settings:farmProfile.supportPhone')}</Label>
                <Input
                  id="support-phone"
                  value={tempSupportInfo.phone}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="support-hours">{t('settings:farmProfile.supportHours')}</Label>
                <Input
                  id="support-hours"
                  value={tempSupportInfo.hours}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, hours: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSupport}>
                  <Save className="w-4 h-4 mr-1" />
                  {t('common:save')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelSupportEdit}>
                  {t('common:cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{supportInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{supportInfo.phone}</span>
              </div>
              <div className="text-sm">
                <strong>{t('settings:farmProfile.supportHours')}:</strong> {supportInfo.hours}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open(`mailto:${supportInfo.email}`, '_blank')}
              >
                {t('settings:farmProfile.contactSupport')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppInfoForm;
