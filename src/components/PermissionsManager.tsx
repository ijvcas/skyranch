
import React, { useState } from 'react';
import { Shield, Eye, Edit, Trash2, Plus, Database, Calendar, FileText, MapPin, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import RoleCard from './permissions/RoleCard';
import PermissionsSummaryCard from './permissions/PermissionsSummaryCard';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
}

const PermissionsManager = () => {
  const { toast } = useToast();
  const { t } = useTranslation('settings');

  const permissions: Permission[] = [
    { id: 'animals_view', name: t('permissions.permissions.animals_view'), description: t('permissions.permissionDesc.animals_view'), category: 'animals', icon: <Eye className="w-4 h-4" /> },
    { id: 'animals_edit', name: t('permissions.permissions.animals_edit'), description: t('permissions.permissionDesc.animals_edit'), category: 'animals', icon: <Edit className="w-4 h-4" /> },
    { id: 'animals_delete', name: t('permissions.permissions.animals_delete'), description: t('permissions.permissionDesc.animals_delete'), category: 'animals', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'animals_create', name: t('permissions.permissions.animals_create'), description: t('permissions.permissionDesc.animals_create'), category: 'animals', icon: <Plus className="w-4 h-4" /> },
    { id: 'lots_manage', name: t('permissions.permissions.lots_manage'), description: t('permissions.permissionDesc.lots_manage'), category: 'lots', icon: <MapPin className="w-4 h-4" /> },
    { id: 'health_records', name: t('permissions.permissions.health_records'), description: t('permissions.permissionDesc.health_records'), category: 'health', icon: <FileText className="w-4 h-4" /> },
    { id: 'breeding_records', name: t('permissions.permissions.breeding_records'), description: t('permissions.permissionDesc.breeding_records'), category: 'breeding', icon: <Database className="w-4 h-4" /> },
    { id: 'calendar_manage', name: t('permissions.permissions.calendar_manage'), description: t('permissions.permissionDesc.calendar_manage'), category: 'calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'users_manage', name: t('permissions.permissions.users_manage'), description: t('permissions.permissionDesc.users_manage'), category: 'users', icon: <Users className="w-4 h-4" /> },
    { id: 'system_settings', name: t('permissions.permissions.system_settings'), description: t('permissions.permissionDesc.system_settings'), category: 'system', icon: <Settings className="w-4 h-4" /> }
  ];

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: t('permissions.roles.admin'),
      description: t('permissions.roles.adminDesc'),
      color: 'bg-red-100 text-red-800',
      permissions: [
        'animals_view', 'animals_edit', 'animals_delete', 'animals_create',
        'lots_manage', 'health_records', 'breeding_records', 'calendar_manage',
        'users_manage', 'system_settings'
      ]
    },
    {
      id: 'manager',
      name: t('permissions.roles.manager'),
      description: t('permissions.roles.managerDesc'),
      color: 'bg-blue-100 text-blue-800',
      permissions: [
        'animals_view', 'animals_edit', 'animals_create',
        'lots_manage', 'health_records', 'breeding_records', 'calendar_manage'
      ]
    },
    {
      id: 'worker',
      name: t('permissions.roles.worker'),
      description: t('permissions.roles.workerDesc'),
      color: 'bg-green-100 text-green-800',
      permissions: [
        'animals_view', 'animals_edit', 'health_records', 'breeding_records'
      ]
    }
  ]);

  const updateRolePermissions = (roleId: string, permissionId: string, enabled: boolean) => {
    setRoles(prevRoles => 
      prevRoles.map(role => {
        if (role.id === roleId) {
          const updatedPermissions = enabled
            ? [...role.permissions, permissionId]
            : role.permissions.filter(p => p !== permissionId);
          
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      })
    );

    toast({
      title: t('permissions.permissionsUpdated'),
      description: t('permissions.permissionsUpdatedDesc'),
    });
  };

  const categorizePermissions = () => {
    const categories = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return categories;
  };

  const getCategoryName = (category: string) => {
    return t(`permissions.categories.${category}`) || category;
  };

  const categorizedPermissions = categorizePermissions();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6" />
        <h2 className="text-2xl font-bold">{t('permissions.title')}</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('permissions.systemRoles')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('permissions.subtitle')}
          </p>
        </div>
        
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            categorizedPermissions={categorizedPermissions}
            getCategoryName={getCategoryName}
            onPermissionToggle={updateRolePermissions}
          />
        ))}
      </div>

      <PermissionsSummaryCard roles={roles} />
    </div>
  );
};

export default PermissionsManager;
