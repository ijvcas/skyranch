
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import SystemBackupManager from '@/components/backup/SystemBackupManager';

const BackupSettings = () => {
  return (
    <TabsContent value="backup" className="space-y-6">
      <SystemBackupManager />
    </TabsContent>
  );
};

export default BackupSettings;
