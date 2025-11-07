import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Database, Shield, Settings as SettingsIcon, Palette, AlertTriangle, Smartphone, Crown } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsOwner } from '@/hooks/useIsOwner';

interface SettingsLayoutProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const SettingsLayout = ({ activeTab, onTabChange, children }: SettingsLayoutProps) => {
  const { checkPermission } = usePermissions();
  const { isOwner } = useIsOwner();
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  useEffect(() => {
    const checkTabPermissions = async () => {
      const tabs = [];
      
      // Subscription tab is always available to all users
      tabs.push('subscription');
      
      // Check permissions for each tab
      if (await checkPermission('users_manage')) {
        tabs.push('users');
      }
      if (await checkPermission('system_settings')) {
        tabs.push('backup', 'permissions', 'system', 'mobile');
      }
      
      // Owner-only tabs
      if (isOwner) {
        tabs.push('customization', 'danger');
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
            Configuración del Sistema
          </h1>
          <p className="text-gray-500">Administración completa del sistema y configuraciones</p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
          <TabsList className="flex flex-col w-full gap-2 h-auto p-2">
            {availableTabs.includes('subscription') && (
              <TabsTrigger value="subscription" className="flex items-center gap-2 w-full justify-center">
                <Crown className="w-4 h-4" />
                Suscripción
              </TabsTrigger>
            )}
            {availableTabs.includes('users') && (
              <TabsTrigger value="users" className="flex items-center gap-2 w-full justify-center">
                <Users className="w-4 h-4" />
                Usuarios
              </TabsTrigger>
            )}
            {availableTabs.includes('backup') && (
              <TabsTrigger value="backup" className="flex items-center gap-2 w-full justify-center">
                <Database className="w-4 h-4" />
                Backup
              </TabsTrigger>
            )}
            {availableTabs.includes('permissions') && (
              <TabsTrigger value="permissions" className="flex items-center gap-2 w-full justify-center">
                <Shield className="w-4 h-4" />
                Permisos
              </TabsTrigger>
            )}
            {availableTabs.includes('system') && (
              <TabsTrigger value="system" className="flex items-center gap-2 w-full justify-center">
                <SettingsIcon className="w-4 h-4" />
                Sistema
              </TabsTrigger>
            )}
            {availableTabs.includes('mobile') && (
              <TabsTrigger value="mobile" className="flex items-center gap-2 w-full justify-center">
                <Smartphone className="w-4 h-4" />
                Móvil
              </TabsTrigger>
            )}
            {availableTabs.includes('customization') && (
              <TabsTrigger value="customization" className="flex items-center gap-2 w-full justify-center">
                <Palette className="w-4 h-4" />
                Personalización
              </TabsTrigger>
            )}
            {availableTabs.includes('danger') && (
              <TabsTrigger value="danger" className="flex items-center gap-2 w-full justify-center">
                <AlertTriangle className="w-4 h-4" />
                Zona de Peligro
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
