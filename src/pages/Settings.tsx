
import React, { useState } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserSettings from '@/components/settings/UserSettings';
import BackupSettings from '@/components/settings/BackupSettings';
import PermissionsSettings from '@/components/settings/PermissionsSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import PermissionGuard from '@/components/PermissionGuard';
import { TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <PermissionGuard permission="system_settings">
      <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <TabsContent value="users" className="mt-8">
          <PermissionGuard permission="users_manage">
            <UserSettings />
          </PermissionGuard>
        </TabsContent>
        
        <TabsContent value="backup" className="mt-8">
          <PermissionGuard permission="system_settings">
            <BackupSettings />
          </PermissionGuard>
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-8">
          <PermissionGuard permission="system_settings">
            <PermissionsSettings />
          </PermissionGuard>
        </TabsContent>
        
        <TabsContent value="system" className="mt-8">
          <PermissionGuard permission="system_settings">
            <SystemSettings />
          </PermissionGuard>
        </TabsContent>
      </SettingsLayout>
    </PermissionGuard>
  );
};

export default Settings;
