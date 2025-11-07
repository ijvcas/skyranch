
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, HelpCircle, Mail, Phone, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportSettingsService } from '@/services/supportSettingsService';
import { useTranslation } from 'react-i18next';

interface SupportInfoSettingsProps {
  isAdmin: boolean;
}

const SupportInfoSettings = ({ isAdmin }: SupportInfoSettingsProps) => {
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [supportInfo, setSupportInfo] = useState({
    email: 'soporte@skyranch.es',
    phone: '+34 123 456 789',
    hours: 'Lunes a Viernes 9:00 AM - 6:00 PM'
  });
  
  const [tempSupportInfo, setTempSupportInfo] = useState(supportInfo);

  useEffect(() => {
    loadSupportInfo();
  }, []);

  const loadSupportInfo = async () => {
    try {
      const data = await supportSettingsService.getSupportSettings();
      if (data) {
        const loadedInfo = {
          email: data.email,
          phone: data.phone,
          hours: data.hours
        };
        setSupportInfo(loadedInfo);
        setTempSupportInfo(loadedInfo);
      }
    } catch (error) {
      console.error('Error loading support info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await supportSettingsService.updateSupportSettings(tempSupportInfo);
      setSupportInfo(tempSupportInfo);
      setIsEditing(false);
      toast({
        title: "Información actualizada",
        description: "La información de soporte técnico ha sido actualizada.",
      });
    } catch (error) {
      console.error('Error saving support info:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la información de soporte.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setTempSupportInfo(supportInfo);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Cargando información de soporte...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-600" />
          {t('support.title')}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="ml-auto bg-orange-50 hover:bg-orange-100"
              title="Editar información de soporte técnico"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing && isAdmin ? (
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
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
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
              <strong>{t('support.schedule')}:</strong> {supportInfo.hours}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.open(`mailto:${supportInfo.email}`, '_blank')}
            >
              {t('support.contactSupport')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupportInfoSettings;
