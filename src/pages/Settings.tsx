
import React, { useState } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserSettings from '@/components/settings/UserSettings';
import BackupSettings from '@/components/settings/BackupSettings';
import PermissionsSettings from '@/components/settings/PermissionsSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import FactoryReset from '@/components/settings/FactoryReset';
import MobileSettings from '@/components/settings/MobileSettings';
import SubscriptionSettings from '@/components/settings/SubscriptionSettings';
import FarmProfileSettings from '@/components/settings/FarmProfileSettings';
import RegionalSettings from '@/components/settings/RegionalSettings';
import AppInfoForm from '@/components/AppInfoForm';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { useIsOwner } from '@/hooks/useIsOwner';
import { TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('subscription');
  const { hasPermission } = useAuthPermissions();
  const { isOwner } = useIsOwner();

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="subscription" className="mt-8">
        <SubscriptionSettings />
      </TabsContent>

      <TabsContent value="farm" className="mt-8">
        <div className="space-y-6">
          <FarmProfileSettings />
          <RegionalSettings />
          <AppInfoForm isAdmin={isOwner} />
        </div>
      </TabsContent>

      {hasPermission('users_manage') && (
        <TabsContent value="users" className="mt-8">
          <UserSettings />
        </TabsContent>
      )}
      
      {hasPermission('system_settings') && (
        <>
          <TabsContent value="backup" className="mt-8">
            <BackupSettings />
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-8">
            <PermissionsSettings />
          </TabsContent>
          
          <TabsContent value="mobile" className="mt-8">
            <MobileSettings />
          </TabsContent>
        </>
      )}
      
      {isOwner && (
        <>
          <TabsContent value="system" className="mt-8">
            <SystemSettings />
          </TabsContent>
          
          <TabsContent value="danger" className="mt-8">
            <FactoryReset />
          </TabsContent>
        </>
      )}
    </SettingsLayout>
  );
};

export default Settings;
