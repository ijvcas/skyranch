
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import PermissionsManager from '@/components/PermissionsManager';
import PermissionGuard from '@/components/PermissionGuard';

const PermissionsSettings = () => {
  return (
    <TabsContent value="permissions" className="space-y-6">
      <PermissionGuard permission="system_settings">
        <PermissionsManager />
      </PermissionGuard>
    </TabsContent>
  );
};

export default PermissionsSettings;
