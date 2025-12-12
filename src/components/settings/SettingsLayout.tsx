import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Database, Shield, Settings as SettingsIcon, AlertTriangle, Smartphone, Building2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsOwner } from '@/hooks/useIsOwner';
import { useTranslation } from 'react-i18next';

interface SettingsLayoutProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const SettingsLayout = ({ activeTab, onTabChange, children }: SettingsLayoutProps) => {
  const { checkPermission } = usePermissions();
  const { isOwner } = useIsOwner();
  const { t } = useTranslation('settings');
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  useEffect(() => {
    const checkTabPermissions = async () => {
      const tabs = [];
      
      // Farm tab is always available to all users
      tabs.push('farm');
      
      // Check permissions for each tab
      if (await checkPermission('users_manage')) {
        tabs.push('users');
      }
      if (await checkPermission('system_settings')) {
        tabs.push('backup', 'permissions', 'mobile');
      }
      
      // Owner-only tabs
      if (isOwner) {
        tabs.push('system', 'danger');
      }
      
      setAvailableTabs(tabs);
      
      // If current active tab is not available, switch to first available
      if (tabs.length > 0 && !tabs.includes(activeTab)) {
        onTabChange(tabs[0]);
      }
    };

    checkTabPermissions();
  }, [checkPermission, isOwner, activeTab, onTabChange]);

  return (
    <div className="page-with-logo">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('general.title')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
          <TabsList className="flex flex-col w-full gap-2 h-auto p-2">
            {availableTabs.includes('farm') && (
              <TabsTrigger value="farm" className="flex items-center gap-2 w-full justify-center">
                <Building2 className="w-4 h-4" />
                {t('tabs.farm')}
              </TabsTrigger>
            )}
            {availableTabs.includes('users') && (
              <TabsTrigger value="users" className="flex items-center gap-2 w-full justify-center">
                <Users className="w-4 h-4" />
                {t('tabs.users')}
              </TabsTrigger>
            )}
            {availableTabs.includes('backup') && (
              <TabsTrigger value="backup" className="flex items-center gap-2 w-full justify-center">
                <Database className="w-4 h-4" />
                {t('tabs.backup')}
              </TabsTrigger>
            )}
            {availableTabs.includes('permissions') && (
              <TabsTrigger value="permissions" className="flex items-center gap-2 w-full justify-center">
                <Shield className="w-4 h-4" />
                {t('tabs.permissions')}
              </TabsTrigger>
            )}
            {availableTabs.includes('system') && (
              <TabsTrigger value="system" className="flex items-center gap-2 w-full justify-center">
                <SettingsIcon className="w-4 h-4" />
                {t('tabs.advanced')}
              </TabsTrigger>
            )}
            {availableTabs.includes('mobile') && (
              <TabsTrigger value="mobile" className="flex items-center gap-2 w-full justify-center">
                <Smartphone className="w-4 h-4" />
                {t('tabs.mobile')}
              </TabsTrigger>
            )}
            {availableTabs.includes('danger') && (
              <TabsTrigger value="danger" className="flex items-center gap-2 w-full justify-center">
                <AlertTriangle className="w-4 h-4" />
                {t('tabs.danger')}
              </TabsTrigger>
            )}
          </TabsList>

          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsLayout;
