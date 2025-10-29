
import React, { useState } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import UserSettings from '@/components/settings/UserSettings';
import BackupSettings from '@/components/settings/BackupSettings';
import PermissionsSettings from '@/components/settings/PermissionsSettings';
import SystemSettings from '@/components/settings/SystemSettings';
import FarmCustomization from '@/components/settings/FarmCustomization';
import FactoryReset from '@/components/settings/FactoryReset';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';
import { useAuthPermissions } from '@/hooks/useAuthPermissions';
import { useIsOwner } from '@/hooks/useIsOwner';
import { TabsContent } from '@/components/ui/tabs';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('security');
  const { hasPermission } = useAuthPermissions();
  const { isOwner } = useIsOwner();

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <TabsContent value="security" className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Autenticación Biométrica
            </CardTitle>
            <CardDescription>
              La autenticación biométrica se gestiona desde la página de inicio de sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Info className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Cómo configurar Face ID</p>
                <p className="text-sm text-muted-foreground">
                  Para activar o desactivar Face ID, usa la opción disponible en la pantalla de inicio de sesión.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
  );
};

export default Settings;
