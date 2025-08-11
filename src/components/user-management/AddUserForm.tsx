
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AppUser } from '@/services/userService';
import NotificationPreferencesForm from '../user-edit/NotificationPreferencesForm';

interface AddUserFormProps {
  newUser: {
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
  onUserChange: (user: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AddUserForm: React.FC<AddUserFormProps> = ({
  newUser,
  onUserChange,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const handleNotificationPreferenceChange = (field: string, value: boolean) => {
    onUserChange({
      ...newUser,
      notificationPreferences: {
        ...newUser.notificationPreferences,
        [field]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => onUserChange({...newUser, name: e.target.value})}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => onUserChange({...newUser, email: e.target.value})}
                  placeholder="juan@granja.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => onUserChange({...newUser, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={newUser.role} onValueChange={(value) => onUserChange({...newUser, role: value as AppUser['role']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Trabajador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <NotificationPreferencesForm
            preferences={newUser.notificationPreferences}
            onPreferencesChange={handleNotificationPreferenceChange}
            userEmail={newUser.email}
            isDisabled={isLoading}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
              {isLoading ? 'Agregando...' : 'Agregar Usuario'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddUserForm;
