import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Bell, MapPin, RotateCcw, MessageCircle, Calendar, Contact, Phone, Trash2, Pencil, PhoneCall } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Capacitor } from '@capacitor/core';
import { contactsService, ContactInfo } from '@/services/mobile/contactsService';
import { calendarService } from '@/services/mobile/calendarService';
import { calendarSyncService } from '@/services/mobile/calendarSyncService';
import { useToast } from '@/hooks/use-toast';
import { hapticService } from '@/services/mobile/hapticService';
import { useFarmBranding } from '@/hooks/useFarmBranding';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string; // Primary/selected phone
  phones?: string[]; // All available phone numbers
  relationship: string;
}

const MobileSettings: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { branding: farmBranding } = useFarmBranding();
  const farmName = farmBranding?.farm_name || 'SKYRANCH';
  
  // Contacts state
  const [veterinarian, setVeterinarian] = useState<ContactInfo | null>(null);
  
  // Calendar state
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [calendarPermissionStatus, setCalendarPermissionStatus] = useState<string>('unknown');
  const [calendarName, setCalendarName] = useState('FARMIKA');
  const [defaultReminderTime, setDefaultReminderTime] = useState('1hour');
  const [isSyncingExisting, setIsSyncingExisting] = useState(false);
  
  // Phone selection dialog state
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);
  const [phoneDialogMode, setPhoneDialogMode] = useState<'vet' | 'emergency' | 'change'>('vet');
  const [changingContactId, setChangingContactId] = useState<string | null>(null);

  // Load emergency contacts from database
  const { data: dbContacts = [] } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isNative
  });

  // Transform database contacts to UI format
  const emergencyContacts: EmergencyContact[] = dbContacts
    .filter(c => c.contact_type === 'emergency')
    .map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      relationship: c.relationship || farmName
    }));

  // Mutations for database operations
  const saveVetMutation = useMutation({
    mutationFn: async (contact: ContactInfo) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('user_emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_type', 'veterinarian')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_emergency_contacts')
          .update({
            name: contact.name,
            phone: contact.phone || '',
            email: contact.email || null
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_emergency_contacts')
          .insert({
            user_id: user.id,
            contact_type: 'veterinarian',
            name: contact.name,
            phone: contact.phone || '',
            email: contact.email || null
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    }
  });

  const addEmergencyMutation = useMutation({
    mutationFn: async (contact: EmergencyContact) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_emergency_contacts')
        .insert({
          user_id: user.id,
          contact_type: 'emergency',
          name: contact.name,
          phone: contact.phone,
          relationship: contact.relationship || null
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    }
  });

  const removeContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_emergency_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    }
  });

  const updateRelationshipMutation = useMutation({
    mutationFn: async ({ id, relationship }: { id: string; relationship: string }) => {
      const { error } = await supabase
        .from('user_emergency_contacts')
        .update({ relationship })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
    }
  });

  useEffect(() => {
    if (isNative) {
      loadSavedSettings();
      checkCalendarPermissions();
      
      // Re-verify calendar sync status on load
      const savedCalendarSync = localStorage.getItem('farmika_calendar_sync');
      if (savedCalendarSync === 'true') {
        // Double-check actual permissions match what we think
        setTimeout(async () => {
          const actualStatus = await calendarService.checkPermissions();
          if (actualStatus !== 'granted' && calendarSyncEnabled) {
            console.log('📅 Calendar sync was enabled but permissions not granted, disabling');
            setCalendarSyncEnabled(false);
            localStorage.setItem('farmika_calendar_sync', 'false');
          }
        }, 2000);
      }

      // Listen for app resume to re-check permissions
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          console.log('📅 App resumed, re-checking calendar permissions');
          const status = await calendarService.checkPermissions();
          setCalendarPermissionStatus(status);
          
          // Update sync state if permissions changed
          if (status !== 'granted' && calendarSyncEnabled) {
            setCalendarSyncEnabled(false);
            localStorage.setItem('farmika_calendar_sync', 'false');
          } else if (status === 'granted' && localStorage.getItem('farmika_calendar_sync') === 'true') {
            setCalendarSyncEnabled(true);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isNative, calendarSyncEnabled]);

  const checkCalendarPermissions = async () => {
    const status = await calendarService.checkPermissions();
    console.log('📅 Calendar permission check result:', status);
    setCalendarPermissionStatus(status);
    
    if (status === 'unavailable') {
      toast({
        title: "Plugin no disponible",
        description: "Ejecuta: npx cap sync ios",
        variant: "destructive",
      });
    }
    
    return status;
  };

  const loadSavedSettings = async () => {
    // Load veterinarian from database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_type', 'veterinarian')
        .maybeSingle();

      if (data) {
        setVeterinarian({
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          phones: [data.phone]
        });
      }
    }

    // Load calendar settings from localStorage (UI preferences, not sensitive data)
    const savedCalendarSync = localStorage.getItem('farmika_calendar_sync');
    const savedCalendarName = localStorage.getItem('farmika_calendar_name');
    const savedReminderTime = localStorage.getItem('farmika_reminder_time');

    if (savedCalendarSync) setCalendarSyncEnabled(savedCalendarSync === 'true');
    if (savedCalendarName) setCalendarName(savedCalendarName);
    if (savedReminderTime) setDefaultReminderTime(savedReminderTime);
  };

  const handlePickVeterinarian = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      // If contact has multiple phones, show selection dialog
      if (contact.phones && contact.phones.length > 1) {
        setSelectedContact(contact);
        setPhoneDialogMode('vet');
        setShowPhoneDialog(true);
      } else {
        setVeterinarian(contact);
        await saveVetMutation.mutateAsync(contact);
        toast({
          title: "Veterinario Seleccionado",
          description: `${contact.name} ha sido agregado como veterinario.`,
        });
      }
    }
  };

  const handleChangeVeterinarian = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      // If contact has multiple phones, show selection dialog
      if (contact.phones && contact.phones.length > 1) {
        setSelectedContact(contact);
        setPhoneDialogMode('vet');
        setShowPhoneDialog(true);
      } else {
        setVeterinarian(contact);
        await saveVetMutation.mutateAsync(contact);
        toast({
          title: "Veterinario Actualizado",
          description: `${contact.name} ha sido seleccionado como nuevo veterinario.`,
        });
      }
    }
  };

  const handleRemoveVeterinarian = async () => {
    hapticService.medium();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_type', 'veterinarian')
        .maybeSingle();

      if (data) {
        await removeContactMutation.mutateAsync(data.id);
      }
    }
    setVeterinarian(null);
    toast({
      title: "Veterinario Eliminado",
      description: "Puedes seleccionar uno nuevo cuando lo necesites.",
    });
  };

  const handleAddEmergencyContact = async () => {
    hapticService.light();
    const contact = await contactsService.pickContact();
    if (contact) {
      // If contact has multiple phones, show selection dialog
      if (contact.phones && contact.phones.length > 1) {
        setSelectedContact(contact);
        setPhoneDialogMode('emergency');
        setShowPhoneDialog(true);
        return;
      }
      
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
        relationship: farmName,
      };
      await addEmergencyMutation.mutateAsync(newContact);
      toast({
        title: "Contacto Agregado",
        description: `${contact.name} ha sido agregado a contactos de emergencia.`,
      });
    }
  };

  const handleRemoveContact = async (id: string) => {
    hapticService.medium();
    await removeContactMutation.mutateAsync(id);
  };

  const handleUpdateContactRelationship = async (id: string, relationship: string) => {
    await updateRelationshipMutation.mutateAsync({ id, relationship });
  };

  const handleToggleCalendarSync = async (enabled: boolean) => {
    hapticService.medium();
    if (enabled) {
      // First check if plugin is available
      if (!calendarService.isAvailable()) {
        toast({
          title: "Plugin no disponible",
          description: "Ejecuta: git pull, npm install, npx cap sync ios",
          variant: "destructive",
        });
        return;
      }
      
      // CHECK FIRST if permissions are already granted
      const currentStatus = await calendarService.checkPermissions();
      console.log('📅 Current permission status before toggle:', currentStatus);
      
      if (currentStatus === 'granted') {
        // Permission already granted! Just enable sync
        setCalendarSyncEnabled(true);
        setCalendarPermissionStatus('granted');
        localStorage.setItem('farmika_calendar_sync', 'true');
        toast({
          title: "Calendario Sincronizado",
          description: "Los eventos se sincronizarán con tu Calendario de iOS.",
        });
        return;
      }
      
      // If not granted, request permissions
      const granted = await calendarService.requestPermissions();
      console.log('📅 Permission request result:', granted);
      
      if (granted) {
        setCalendarSyncEnabled(true);
        setCalendarPermissionStatus('granted');
        localStorage.setItem('farmika_calendar_sync', 'true');
        toast({
          title: "Calendario Sincronizado",
          description: "Los eventos se sincronizarán con tu Calendario de iOS.",
        });
        
        // Re-check permissions after a delay to ensure iOS updates
        setTimeout(() => checkCalendarPermissions(), 1500);
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

  const handleSyncExistingEvents = async () => {
    setIsSyncingExisting(true);
    hapticService.light();

    try {
      const result = await calendarSyncService.syncAllExistingEvents();
      
      if (result.success > 0) {
        toast({
          title: "Sincronización Completada",
          description: `${result.success} eventos sincronizados al Calendario de iOS.`,
        });
      } else if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: "Error en Sincronización",
          description: `No se pudieron sincronizar ${result.failed} eventos.`,
        });
      } else {
        toast({
          title: "Sin Eventos",
          description: "No hay eventos para sincronizar.",
        });
      }
    } catch (error) {
      console.error('Error syncing existing events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la sincronización.",
      });
    } finally {
      setIsSyncingExisting(false);
    }
  };

  const handlePhoneSelection = async (phone: string) => {
    if (!selectedContact) return;
    
    if (phoneDialogMode === 'vet') {
      // New veterinarian selection
      const updatedContact = { ...selectedContact, phone };
      setVeterinarian(updatedContact);
      await saveVetMutation.mutateAsync(updatedContact);
      toast({
        title: "Veterinario Seleccionado",
        description: `${selectedContact.name} - ${phone}`,
      });
    } else if (phoneDialogMode === 'emergency') {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: selectedContact.name,
        phone,
        relationship: farmName,
      };
      await addEmergencyMutation.mutateAsync(newContact);
      toast({
        title: "Contacto Agregado",
        description: `${selectedContact.name} - ${phone}`,
      });
    } else if (phoneDialogMode === 'change' && changingContactId) {
      const contact = emergencyContacts.find(c => c.id === changingContactId);
      if (contact) {
        const { error } = await supabase
          .from('user_emergency_contacts')
          .update({ phone })
          .eq('id', changingContactId);
        
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
          toast({
            title: "Teléfono Actualizado",
            description: `Ahora usando ${phone}`,
          });
        }
      }
    }
    
    setShowPhoneDialog(false);
    setSelectedContact(null);
    setChangingContactId(null);
  };

  const handleChangeContactPhone = (contactId: string) => {
    const contact = emergencyContacts.find(c => c.id === contactId);
    if (contact && contact.phones && contact.phones.length > 1) {
      setSelectedContact({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        phones: contact.phones
      });
      setPhoneDialogMode('change');
      setChangingContactId(contactId);
      setShowPhoneDialog(true);
    }
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
              <div className="p-4 border rounded-lg bg-green-50 space-y-3">
                <div>
                  <p className="font-medium text-lg">{veterinarian.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{veterinarian.phone}</p>
                    {veterinarian.phones && veterinarian.phones.length > 1 && (
                      <span className="text-xs text-primary">
                        +{veterinarian.phones.length - 1} más
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => contactsService.dialNumber(veterinarian.phone!)}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => contactsService.sendMessage(veterinarian.phone!)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleChangeVeterinarian}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleRemoveVeterinarian}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                {veterinarian.phones && veterinarian.phones.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setSelectedContact(veterinarian);
                      setPhoneDialogMode('change');
                      setShowPhoneDialog(true);
                    }}
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Cambiar Número de Teléfono
                  </Button>
                )}
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
                  <div key={contact.id} className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-card">
                    {/* Name with phone count indicator */}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{contact.name}</p>
                      {contact.phones && contact.phones.length > 1 && (
                        <span className="text-xs text-primary">
                          +{contact.phones.length - 1}
                        </span>
                      )}
                    </div>
                    
                    {/* Full phone number */}
                    <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      {contact.phones && contact.phones.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleChangeContactPhone(contact.id)}
                          className="h-7 w-7 p-0"
                        >
                          <PhoneCall className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => contactsService.dialNumber(contact.phone)}
                        className="h-7 w-7 p-0"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => contactsService.sendMessage(contact.phone)}
                        className="h-7 w-7 p-0"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    
                    {/* Relationship selector */}
                    <Select
                      value={contact.relationship}
                      onValueChange={(value) => handleUpdateContactRelationship(contact.id, value)}
                    >
                      <SelectTrigger className="w-full h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="Veterinario">Veterinario</SelectItem>
                        <SelectItem value="Comprador">Comprador</SelectItem>
                        <SelectItem value="Empleado">Empleado</SelectItem>
                        <SelectItem value="Transporte">Transporte</SelectItem>
                        <SelectItem value={farmName}>{farmName}</SelectItem>
                      </SelectContent>
                    </Select>
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

              <Button 
                onClick={handleSyncExistingEvents} 
                variant="outline" 
                className="w-full"
                disabled={isSyncingExisting}
              >
                {isSyncingExisting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sincronizando...
                  </div>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Sincronizar Eventos Existentes
                  </>
                )}
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
                {calendarPermissionStatus === 'unknown' && '❓ Verificando...'}
              </p>
            </div>
            {(calendarPermissionStatus === 'denied' || calendarPermissionStatus === 'unavailable') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  const status = await checkCalendarPermissions();
                  // If permissions are now granted, update the toggle state
                  if (status === 'granted' && localStorage.getItem('farmika_calendar_sync') === 'true') {
                    setCalendarSyncEnabled(true);
                  }
                }}
              >
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phone Selection Dialog */}
      <AlertDialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seleccionar Número de Teléfono</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedContact?.name} tiene múltiples números. Selecciona cuál usar:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            {selectedContact?.phones?.map((phone, index) => (
              <Button
                key={phone}
                variant={phone === selectedContact.phone ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handlePhoneSelection(phone)}
              >
                <Phone className="w-4 h-4 mr-2" />
                {phone}
                {phone === selectedContact.phone && " (Actual)"}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
