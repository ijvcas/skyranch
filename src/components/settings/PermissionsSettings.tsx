
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import PermissionsManager from '@/components/PermissionsManager';

const PermissionsSettings = () => {
  return (
    <TabsContent value="permissions" className="space-y-6">
      <PermissionsManager />
    </TabsContent>
  );
};

export default PermissionsSettings;
