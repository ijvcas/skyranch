
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type AppUser } from '@/services/userService';
import NotificationPreferencesForm from './NotificationPreferencesForm';

interface UserEditFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    role: AppUser['role'];
    is_active: boolean;
    notificationPreferences: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  onInputChange: (field: string, value: any) => void;
  phoneError: string;
  setPhoneError: (error: string) => void;
  isDisabled: boolean;
  isAdminUser: boolean;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  formData,
  onInputChange,
  phoneError,
  setPhoneError,
  isDisabled,
  isAdminUser
}) => {
  const handleNotificationPreferenceChange = (field: string, value: boolean) => {
    onInputChange('notificationPreferences', {
      ...formData.notificationPreferences,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Ingrese el nombre completo"
            required
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            disabled={isDisabled}
          />
          {phoneError && (
            <p className="text-sm text-red-600">{phoneError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select
            value={formData.role}
            onValueChange={(value: 'admin' | 'manager' | 'worker') => onInputChange('role', value)}
            disabled={isDisabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
              <SelectItem value="worker">Trabajador</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Solo los administradores pueden cambiar roles de usuarios.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onInputChange('is_active', checked)}
            disabled={isDisabled || isAdminUser}
          />
          <Label htmlFor="is_active">Usuario Activo</Label>
          {isAdminUser && (
            <p className="text-xs text-gray-500 ml-2">
              (Los administradores principales no se pueden desactivar)
            </p>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferencesForm
        preferences={formData.notificationPreferences}
        onPreferencesChange={handleNotificationPreferenceChange}
        userEmail={formData.email}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default UserEditForm;
