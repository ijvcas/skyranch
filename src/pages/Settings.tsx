
import React, { useState } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserSettings from '@/components/settings/UserSettings';
import BackupSettings from '@/components/settings/BackupSettings';
import PermissionsSettings from '@/components/settings/PermissionsSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import FarmCustomization from '@/components/settings/FarmCustomization';
import FactoryReset from '@/components/settings/FactoryReset';
import PermissionGuard from '@/components/PermissionGuard';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { useIsOwner } from '@/hooks/useIsOwner';
import { TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { hasPermission } = useAuthPermissions();
  const { isOwner } = useIsOwner();

  return (
    <PermissionGuard permission="system_settings">
      <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
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
            
            <TabsContent value="system" className="mt-8">
              <SystemSettings />
            </TabsContent>
          </>
        )}
        
        {isOwner && (
          <>
            <TabsContent value="customization" className="mt-8">
              <FarmCustomization />
            </TabsContent>
            
            <TabsContent value="danger" className="mt-8">
              <FactoryReset />
            </TabsContent>
          </>
        )}
      </SettingsLayout>
    </PermissionGuard>
  );
};

export default Settings;
