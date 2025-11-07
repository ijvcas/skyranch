
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import InviteUserDialog from './InviteUserDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AppUser } from '@/services/userService';
import NotificationPreferencesForm from '../user-edit/NotificationPreferencesForm';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('users');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('form.addNew')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="invite" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">{t('form.inviteTab')}</TabsTrigger>
              <TabsTrigger value="direct">{t('form.directTab')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="invite" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('form.inviteDescription')}
              </p>
              <Button onClick={() => setInviteDialogOpen(true)} className="w-full">
                {t('form.openInvite')}
              </Button>
            </TabsContent>
            
            <TabsContent value="direct">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('form.fullName')}</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => onUserChange({...newUser, name: e.target.value})}
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t('form.email')}</Label>
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
                <Label htmlFor="phone">{t('form.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => onUserChange({...newUser, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="role">{t('form.role')}</Label>
                <Select value={newUser.role} onValueChange={(value) => onUserChange({...newUser, role: value as AppUser['role']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">{t('roles.worker')}</SelectItem>
                    <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                    <SelectItem value="admin">{t('roles.admin')}</SelectItem>
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
              {isLoading ? t('form.adding') : t('form.addUser')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('form.cancel')}
            </Button>
          </div>
        </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <InviteUserDialog 
        isOpen={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />
    </>
  );
};

export default AddUserForm;
