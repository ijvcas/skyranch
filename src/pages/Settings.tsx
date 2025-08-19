
import React, { useState } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserSettings from '@/components/settings/UserSettings';
import BackupSettings from '@/components/settings/BackupSettings';
import PermissionsSettings from '@/components/settings/PermissionsSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="users" className="mt-8">
        <UserSettings />
      </TabsContent>
      
      <TabsContent value="backup" className="mt-8">
        <BackupSettings />
      </TabsContent>
      
      <TabsContent value="permissions" className="mt-8">
        <PermissionsSettings />
      </TabsContent>
      
      <TabsContent value="system" className="mt-8">
        <SystemSettings />
      </TabsContent>
    </SettingsLayout>
  );
};

export default Settings;
