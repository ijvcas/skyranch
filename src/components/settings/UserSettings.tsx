
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import UserManagement from '@/components/UserManagement';

const UserSettings = () => {
  return (
    <TabsContent value="users" className="space-y-6">
      <UserManagement />
    </TabsContent>
  );
};

export default UserSettings;
