
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Info, HelpCircle, Mail, Phone } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppInfoFormProps {
  isAdmin: boolean;
}

const AppInfoForm = ({ isAdmin }: AppInfoFormProps) => {
  const { toast } = useToast();
  
  console.log('AppInfoForm - isAdmin:', isAdmin); // Debug log
  
  const [isEditingApp, setIsEditingApp] = useState(false);
  const [isEditingSupport, setIsEditingSupport] = useState(false);
  
  const [appInfo, setAppInfo] = useState({
    version: 'SkyRanch v1.2.0',
    lastUpdate: 'Enero 2025',
    build: '2025.01.05',
    admin: 'Juan Casanova H',
    description: 'Sistema de gestión ganadera completo'
  });
  
  const [supportInfo, setSupportInfo] = useState({
    email: 'soporte@skyranch.com',
    phone: '+1 (555) 123-4567',
    hours: 'Lunes a Viernes 8:00 AM - 6:00 PM'
  });

  const [tempAppInfo, setTempAppInfo] = useState(appInfo);
  const [tempSupportInfo, setTempSupportInfo] = useState(supportInfo);

  const handleSaveApp = () => {
    setAppInfo(tempAppInfo);
    setIsEditingApp(false);
    toast({
      title: "Información actualizada",
      description: "La información de la aplicación ha sido actualizada.",
    });
  };

  const handleSaveSupport = () => {
    setSupportInfo(tempSupportInfo);
    setIsEditingSupport(false);
    toast({
      title: "Información actualizada",
      description: "La información de soporte técnico ha sido actualizada.",
    });
  };

  const handleCancelAppEdit = () => {
    setTempAppInfo(appInfo);
    setIsEditingApp(false);
  };

  const handleCancelSupportEdit = () => {
    setTempSupportInfo(supportInfo);
    setIsEditingSupport(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* App Version Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Información de la Aplicación
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingApp(!isEditingApp)}
                className="ml-auto bg-blue-50 hover:bg-blue-100"
                title="Editar información de la aplicación"
                aria-label={isEditingApp ? 'Cerrar edición de la aplicación' : 'Editar información de la aplicación'}
              >
                {isEditingApp ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingApp ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="app-version">Versión</Label>
                <Input
                  id="app-version"
                  value={tempAppInfo.version}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, version: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-update">Última Actualización</Label>
                <Input
                  id="app-update"
                  value={tempAppInfo.lastUpdate}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, lastUpdate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-build">Build</Label>
                <Input
                  id="app-build"
                  value={tempAppInfo.build}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, build: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-admin">Administrador Principal</Label>
                <Input
                  id="app-admin"
                  value={tempAppInfo.admin}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, admin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="app-description">Descripción</Label>
                <Textarea
                  id="app-description"
                  value={tempAppInfo.description}
                  onChange={(e) => setTempAppInfo({...tempAppInfo, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveApp}>
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelAppEdit}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm">
                <strong>Versión:</strong> {appInfo.version}
              </div>
              <div className="text-sm">
                <strong>Última actualización:</strong> {appInfo.lastUpdate}
              </div>
              <div className="text-sm">
                <strong>Build:</strong> {appInfo.build}
              </div>
              <div className="text-sm">
                <strong>Administrador Principal:</strong> {appInfo.admin}
              </div>
              <div className="text-sm">
                <strong>Descripción:</strong> {appInfo.description}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            Soporte Técnico
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSupport(!isEditingSupport)}
                className="ml-auto bg-orange-50 hover:bg-orange-100"
                title="Editar información de soporte técnico"
                aria-label={isEditingSupport ? 'Cerrar edición de soporte técnico' : 'Editar información de soporte técnico'}
              >
                {isEditingSupport ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditingSupport ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="support-email">Email de Soporte</Label>
                <Input
                  id="support-email"
                  value={tempSupportInfo.email}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="support-phone">Teléfono de Soporte</Label>
                <Input
                  id="support-phone"
                  value={tempSupportInfo.phone}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="support-hours">Horario de Atención</Label>
                <Input
                  id="support-hours"
                  value={tempSupportInfo.hours}
                  onChange={(e) => setTempSupportInfo({...tempSupportInfo, hours: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveSupport}>
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelSupportEdit}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{supportInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{supportInfo.phone}</span>
              </div>
              <div className="text-sm">
                <strong>Horario:</strong> {supportInfo.hours}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open(`mailto:${supportInfo.email}`, '_blank')}
              >
                Contactar Soporte
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppInfoForm;
