
import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Database, Shield, Settings as SettingsIcon, Rocket } from 'lucide-react';

interface SettingsLayoutProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const SettingsLayout = ({ activeTab, onTabChange, children }: SettingsLayoutProps) => {
  // Static tabs to avoid permission checking loops
  const availableTabs = ['users', 'backup', 'permissions', 'system'];

  return (
    <div className="page-with-logo">
      <div className="w-full py-6 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-500">Administración completa del sistema y configuraciones</p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-8">
          <TabsList className="flex flex-col w-full gap-2 h-auto p-2">
            <TabsTrigger value="users" className="flex items-center gap-2 w-full justify-center">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2 w-full justify-center">
              <Database className="w-4 h-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2 w-full justify-center">
              <Shield className="w-4 h-4" />
              Permisos
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 w-full justify-center">
              <SettingsIcon className="w-4 h-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {children}
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsLayout;
