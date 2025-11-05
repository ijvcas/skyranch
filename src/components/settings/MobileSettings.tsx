import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Bell, MapPin, RotateCcw, MessageCircle, Calendar, Contact, Phone, Trash2, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Capacitor } from '@capacitor/core';
import { contactsService, ContactInfo } from '@/services/mobile/contactsService';
import { calendarService } from '@/services/mobile/calendarService';
import { useToast } from '@/hooks/use-toast';
import { hapticService } from '@/services/mobile/hapticService';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const MobileSettings: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();
  
  // Contacts state
  const [veterinarian, setVeterinarian] = useState<ContactInfo | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  
  // Calendar state
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [calendarPermissionStatus, setCalendarPermissionStatus] = useState<string>('unknown');
  const [calendarName, setCalendarName] = useState('FARMIKA');
  const [defaultReminderTime, setDefaultReminderTime] = useState('1hour');

  useEffect(() => {
    if (isNative) {
      checkCalendarPermissions();
      loadSavedSettings();
    }
  }, [isNative]);

  const checkCalendarPermissions = async () => {
    const status = await calendarService.checkPermissions();
    setCalendarPermissionStatus(status);
  };

  const loadSavedSettings = () => {
    // Load from localStorage or Capacitor Preferences
    const savedVet = localStorage.getItem('farmika_veterinarian');
    const savedContacts = localStorage.getItem('farmika_emergency_contacts');
    const savedCalendarSync = localStorage.getItem('farmika_calendar_sync');
    const savedCalendarName = localStorage.getItem('farmika_calendar_name');
    const savedReminderTime = localStorage.getItem('farmika_reminder_time');

    if (savedVet) setVeterinarian(JSON.parse(savedVet));
    if (savedContacts) setEmergencyContacts(JSON.parse(savedContacts));
    if (savedCalendarSync) setCalendarSyncEnabled(savedCalendarSync === 'true');
    if (savedCalendarName) setCalendarName(savedCalendarName);
    if (savedReminderTime) setDefaultReminderTime(savedReminderTime);
  };

  const handlePickVeterinarian = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      setVeterinarian(contact);
      localStorage.setItem('farmika_veterinarian', JSON.stringify(contact));
      toast({
        title: "Veterinario Seleccionado",
        description: `${contact.name} ha sido agregado como veterinario.`,
      });
    }
  };

  const handleChangeVeterinarian = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      setVeterinarian(contact);
      localStorage.setItem('farmika_veterinarian', JSON.stringify(contact));
      toast({
        title: "Veterinario Actualizado",
        description: `${contact.name} ha sido seleccionado como nuevo veterinario.`,
      });
    }
  };

  const handleRemoveVeterinarian = () => {
    hapticService.medium();
    setVeterinarian(null);
    localStorage.removeItem('farmika_veterinarian');
    toast({
      title: "Veterinario Eliminado",
      description: "Puedes seleccionar uno nuevo cuando lo necesites.",
    });
  };

  const handleAddEmergencyContact = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      // Check for duplicates
      const isDuplicate = emergencyContacts.some(c => c.phone === contact.phone);
      if (isDuplicate) {
        toast({
          title: "Contacto Duplicado",
          description: "Este contacto ya está en tu lista de emergencia.",
          variant: "destructive",
        });
        return;
      }

      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: contact.name,
        phone: contact.phone || '',
        relationship: 'Otro',
      };
      const updated = [...emergencyContacts, newContact];
      setEmergencyContacts(updated);
      localStorage.setItem('farmika_emergency_contacts', JSON.stringify(updated));
      toast({
        title: "Contacto Agregado",
        description: `${contact.name} ha sido agregado a contactos de emergencia.`,
      });
    }
  };

  const handleRemoveContact = (id: string) => {
    hapticService.medium();
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem('farmika_emergency_contacts', JSON.stringify(updated));
  };

  const handleUpdateContactRelationship = (id: string, relationship: string) => {
    const updated = emergencyContacts.map(c => 
      c.id === id ? { ...c, relationship } : c
    );
    setEmergencyContacts(updated);
    localStorage.setItem('farmika_emergency_contacts', JSON.stringify(updated));
  };

  const handleToggleCalendarSync = async (enabled: boolean) => {
    hapticService.medium();
    if (enabled) {
      // Request permissions
      const granted = await calendarService.requestPermissions();
      if (granted) {
        setCalendarSyncEnabled(true);
        setCalendarPermissionStatus('granted');
        localStorage.setItem('farmika_calendar_sync', 'true');
        toast({
          title: "Calendario Sincronizado",
          description: "Los eventos se sincronizarán con tu Calendario de iOS.",
        });
        
        // Re-check permissions after a short delay to ensure UI is updated
        setTimeout(() => checkCalendarPermissions(), 500);
      } else {
        setCalendarPermissionStatus('denied');
        toast({
          title: "Permisos Denegados",
          description: "Ve a Configuración → FARMIKA → Calendarios para otorgar permisos.",
          variant: "destructive",
        });
      }
    } else {
      setCalendarSyncEnabled(false);
      localStorage.setItem('farmika_calendar_sync', 'false');
      toast({
        title: "Sincronización Desactivada",
        description: "Los eventos ya no se sincronizarán con tu Calendario.",
      });
    }
  };

  const handleSaveCalendarSettings = () => {
    hapticService.light();
    localStorage.setItem('farmika_calendar_name', calendarName);
    localStorage.setItem('farmika_reminder_time', defaultReminderTime);
    toast({
      title: "Configuración Guardada",
      description: "Las configuraciones del calendario han sido actualizadas.",
    });
  };

  if (!isNative) {
    return (
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          Estas funciones solo están disponibles en la aplicación móvil nativa (iOS/Android).
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === 'Activo' || status === 'granted') return 'text-green-600';
    if (status === 'Permisos Requeridos') return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Implemented Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Funciones Móviles Implementadas
          </CardTitle>
          <CardDescription>
            Características nativas de iOS integradas en FARMIKA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <FeatureItem
              icon={<Bell className="w-4 h-4" />}
              title="Notificaciones Push"
              description="Recibe alertas importantes sobre tus animales y eventos"
              status="Activo"
            />
            
            <FeatureItem
              icon={<Bell className="w-4 h-4" />}
              title="Recordatorios Locales"
              description="Programa recordatorios para vacunaciones, partos y eventos"
              status="Activo"
            />
            
            <FeatureItem
              icon={<MapPin className="w-4 h-4" />}
              title="Geolocalización"
              description="Guarda la ubicación GPS de animales y eventos en el campo"
              status="Activo"
            />
            
            <FeatureItem
              icon={<RotateCcw className="w-4 h-4" />}
              title="Sincronización Automática"
              description="Sincroniza datos automáticamente al conectarse a internet"
              status="Activo"
            />
            
            <FeatureItem
              icon={<MessageCircle className="w-4 h-4" />}
              title="Compartir Información"
              description="Comparte registros de animales y reportes vía AirDrop, WhatsApp o email"
              status="Activo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="w-5 h-5" />
            Gestión de Contactos
          </CardTitle>
          <CardDescription>
            Acceso rápido a veterinarios y contactos de emergencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Veterinarian Section */}
          <div className="space-y-3">
            <Label>Veterinario Principal</Label>
            {veterinarian ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex-1">
                  <p className="font-medium">{veterinarian.name}</p>
                  <p className="text-sm text-muted-foreground">{veterinarian.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => contactsService.dialNumber(veterinarian.phone!)}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => contactsService.sendMessage(veterinarian.phone!)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleChangeVeterinarian}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveVeterinarian}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handlePickVeterinarian} variant="outline" className="w-full">
                <Contact className="w-4 h-4 mr-2" />
                Seleccionar Veterinario desde Contactos
              </Button>
            )}
          </div>

          {/* Emergency Contacts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Contactos de Emergencia ({emergencyContacts.length}/5)</Label>
              {emergencyContacts.length < 5 && (
                <Button size="sm" onClick={handleAddEmergencyContact} variant="outline">
                  + Agregar
                </Button>
              )}
            </div>
            
            {emergencyContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay contactos de emergencia configurados</p>
            ) : (
              <div className="space-y-2">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      <Select
                        value={contact.relationship}
                        onValueChange={(value) => handleUpdateContactRelationship(contact.id, value)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Veterinario">Veterinario</SelectItem>
                          <SelectItem value="Comprador">Comprador</SelectItem>
                          <SelectItem value="Empleado">Empleado</SelectItem>
                          <SelectItem value="Transporte">Transporte</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => contactsService.dialNumber(contact.phone)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => contactsService.sendMessage(contact.phone)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sincronización con Calendario iOS
          </CardTitle>
          <CardDescription>
            Sincroniza eventos de FARMIKA con tu Calendario de iOS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">Sincronización de Calendario</p>
              <p className="text-sm text-muted-foreground">
                {calendarPermissionStatus === 'granted' 
                  ? 'Eventos se sincronizarán automáticamente'
                  : 'Requiere permisos de calendario'}
              </p>
            </div>
            <Switch
              checked={calendarSyncEnabled}
              onCheckedChange={handleToggleCalendarSync}
            />
          </div>

          {/* Calendar Settings (visible when sync is enabled) */}
          {calendarSyncEnabled && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="calendar-name">Nombre del Calendario</Label>
                <Input
                  id="calendar-name"
                  value={calendarName}
                  onChange={(e) => setCalendarName(e.target.value)}
                  placeholder="FARMIKA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Recordatorio por Defecto</Label>
                <Select value={defaultReminderTime} onValueChange={setDefaultReminderTime}>
                  <SelectTrigger id="reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">15 minutos antes</SelectItem>
                    <SelectItem value="30min">30 minutos antes</SelectItem>
                    <SelectItem value="1hour">1 hora antes</SelectItem>
                    <SelectItem value="2hours">2 horas antes</SelectItem>
                    <SelectItem value="1day">1 día antes</SelectItem>
                    <SelectItem value="2days">2 días antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveCalendarSettings} className="w-full">
                Guardar Configuración
              </Button>
            </div>
          )}

          {/* Permission Status */}
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Estado de Permisos</p>
              <p className={`text-xs ${getStatusColor(calendarPermissionStatus)}`}>
                {calendarPermissionStatus === 'granted' && '✅ Permisos Otorgados'}
                {calendarPermissionStatus === 'denied' && '❌ Permisos Denegados'}
                {calendarPermissionStatus === 'notDetermined' && '⚠️ Permisos No Solicitados'}
                {calendarPermissionStatus === 'unavailable' && '📱 Plugin No Disponible'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, status }) => {
  const statusColor = status === 'Activo' ? 'text-green-600' : 'text-orange-600';
  
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{title}</p>
          <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default MobileSettings;
