
import { supabase } from '@/integrations/supabase/client';
import { getAllUsers } from './userService';
import { getAllAnimals } from './animalService';
import { getAllFieldReports, importFieldReports } from './fieldReportBackupService';
import { Preferences } from '@capacitor/preferences';

export interface ComprehensiveBackupData {
  metadata: {
    exportDate: string;
    version: string;
    platform: 'web' | 'ios';
    appVersion: string;
    selectedCategories: string[];
    totalRecords: number;
    checksum?: string;
  };
  farmProfile?: {
    farm_name: string;
    farm_logo_url?: string;
    theme_primary_color: string;
    theme_secondary_color: string;
    location_name?: string;
    location_coordinates?: string;
    owner_email: string;
  };
  users?: any[];
  animals?: any[];
  fieldReports?: any[];
  lots?: any[];
  cadastralParcels?: any[];
  healthRecords?: any[];
  breedingRecords?: any[];
  calendarEvents?: any[];
  notifications?: any[];
  reports?: any[];
  properties?: any[];
  animalAttachments?: any[];
}

// Lots and related data
export const getAllLots = async () => {
  const { data: lots, error: lotsError } = await supabase
    .from('lots')
    .select('*')
    .order('created_at', { ascending: false });

  if (lotsError) throw lotsError;

  const { data: polygons, error: polygonsError } = await supabase
    .from('lot_polygons')
    .select('*');

  if (polygonsError) throw polygonsError;

  const { data: assignments, error: assignmentsError } = await supabase
    .from('animal_lot_assignments')
    .select('*');

  if (assignmentsError) throw assignmentsError;

  const { data: rotations, error: rotationsError } = await supabase
    .from('lot_rotations')
    .select('*');

  if (rotationsError) throw rotationsError;

  return {
    lots: lots || [],
    polygons: polygons || [],
    assignments: assignments || [],
    rotations: rotations || []
  };
};

// Cadastral data
export const getAllCadastralData = async () => {
  const { data: parcels, error: parcelsError } = await supabase
    .from('cadastral_parcels')
    .select('*')
    .order('created_at', { ascending: false });

  if (parcelsError) throw parcelsError;

  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (propertiesError) throw propertiesError;

  return {
    parcels: parcels || [],
    properties: properties || []
  };
};

// Health records
export const getAllHealthRecords = async () => {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Breeding records
export const getAllBreedingData = async () => {
  const { data: breedingRecords, error: breedingError } = await supabase
    .from('breeding_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (breedingError) throw breedingError;

  const { data: offspring, error: offspringError } = await supabase
    .from('offspring')
    .select('*');

  if (offspringError) throw offspringError;

  return {
    breedingRecords: breedingRecords || [],
    offspring: offspring || []
  };
};

// Calendar events
export const getAllCalendarData = async () => {
  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: false });

  if (eventsError) throw eventsError;

  const { data: notifications, error: notificationsError } = await supabase
    .from('event_notifications')
    .select('*');

  if (notificationsError) throw notificationsError;

  return {
    events: events || [],
    eventNotifications: notifications || []
  };
};

// Notifications
export const getAllNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Reports
export const getAllReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Import functions
export const importLots = async (lotsData: any): Promise<number> => {
  let importCount = 0;

  if (lotsData.lots) {
    const { error } = await supabase.from('lots').insert(lotsData.lots);
    if (!error) importCount += lotsData.lots.length;
  }

  if (lotsData.polygons) {
    const { error } = await supabase.from('lot_polygons').insert(lotsData.polygons);
    if (!error) importCount += lotsData.polygons.length;
  }

  if (lotsData.assignments) {
    const { error } = await supabase.from('animal_lot_assignments').insert(lotsData.assignments);
    if (!error) importCount += lotsData.assignments.length;
  }

  if (lotsData.rotations) {
    const { error } = await supabase.from('lot_rotations').insert(lotsData.rotations);
    if (!error) importCount += lotsData.rotations.length;
  }

  return importCount;
};

export const importCadastralData = async (cadastralData: any): Promise<number> => {
  let importCount = 0;

  if (cadastralData.properties) {
    const { error } = await supabase.from('properties').insert(cadastralData.properties);
    if (!error) importCount += cadastralData.properties.length;
  }

  if (cadastralData.parcels) {
    const { error } = await supabase.from('cadastral_parcels').insert(cadastralData.parcels);
    if (!error) importCount += cadastralData.parcels.length;
  }

  return importCount;
};

export const importHealthRecords = async (healthRecords: any[]): Promise<number> => {
  const { error } = await supabase.from('health_records').insert(healthRecords);
  return error ? 0 : healthRecords.length;
};

export const importBreedingData = async (breedingData: any): Promise<number> => {
  let importCount = 0;

  if (breedingData.breedingRecords) {
    const { error } = await supabase.from('breeding_records').insert(breedingData.breedingRecords);
    if (!error) importCount += breedingData.breedingRecords.length;
  }

  if (breedingData.offspring) {
    const { error } = await supabase.from('offspring').insert(breedingData.offspring);
    if (!error) importCount += breedingData.offspring.length;
  }

  return importCount;
};

export const importCalendarData = async (calendarData: any): Promise<number> => {
  let importCount = 0;

  if (calendarData.events) {
    const { error } = await supabase.from('calendar_events').insert(calendarData.events);
    if (!error) importCount += calendarData.events.length;
  }

  if (calendarData.eventNotifications) {
    const { error } = await supabase.from('event_notifications').insert(calendarData.eventNotifications);
    if (!error) importCount += calendarData.eventNotifications.length;
  }

  return importCount;
};

export const importNotifications = async (notifications: any[]): Promise<number> => {
  const { error } = await supabase.from('notifications').insert(notifications);
  return error ? 0 : notifications.length;
};

export const importReports = async (reports: any[]): Promise<number> => {
  const { error } = await supabase.from('reports').insert(reports);
  return error ? 0 : reports.length;
};

// Animal attachments (document metadata)
export const getAllAnimalAttachments = async () => {
  const { data, error } = await supabase
    .from('animal_attachments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const importAnimalAttachments = async (attachments: any[]): Promise<number> => {
  if (!attachments || attachments.length === 0) return 0;
  
  // Note: This only imports metadata, not the actual files from storage
  const { error } = await supabase.from('animal_attachments').insert(attachments);
  return error ? 0 : attachments.length;
};

// Get farm profile for backup
export const getFarmProfile = async () => {
  const { data: profile, error } = await supabase
    .from('farm_profiles')
    .select('*')
    .single();

  if (error) throw error;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return {
    farm_name: profile?.farm_name || 'Mi Finca',
    farm_logo_url: profile?.farm_logo_url,
    theme_primary_color: profile?.theme_primary_color || '#16a34a',
    theme_secondary_color: profile?.theme_secondary_color || '#22c55e',
    location_name: profile?.location_name,
    location_coordinates: profile?.location_coordinates,
    owner_email: user?.email || ''
  };
};

// Create comprehensive backup with farm branding
export const createBackup = async (storageType: 'local' | 'icloud' = 'local'): Promise<ComprehensiveBackupData> => {
  const farmProfile = await getFarmProfile();
  const users = await getAllUsers();
  const animals = await getAllAnimals();
  const fieldReports = await getAllFieldReports();
  const lotsData = await getAllLots();
  const cadastralData = await getAllCadastralData();
  const healthRecords = await getAllHealthRecords();
  const breedingData = await getAllBreedingData();
  const calendarData = await getAllCalendarData();
  const notifications = await getAllNotifications();
  const reports = await getAllReports();
  const attachments = await getAllAnimalAttachments();

  const backupData: ComprehensiveBackupData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      platform: 'ios',
      appVersion: '1.0.0',
      selectedCategories: ['all'],
      totalRecords: users.length + animals.length + fieldReports.length + 
        lotsData.lots.length + cadastralData.parcels.length + healthRecords.length +
        breedingData.breedingRecords.length + calendarData.events.length
    },
    farmProfile,
    users,
    animals,
    fieldReports,
    lots: lotsData.lots,
    cadastralParcels: cadastralData.parcels,
    healthRecords,
    breedingRecords: breedingData.breedingRecords,
    calendarEvents: calendarData.events,
    notifications,
    reports,
    properties: cadastralData.properties,
    animalAttachments: attachments
  };

  // Save to Capacitor Preferences for quick access
  if (storageType === 'icloud') {
    await Preferences.set({
      key: 'skyranch_last_backup',
      value: JSON.stringify({
        date: backupData.metadata.exportDate,
        farmName: farmProfile.farm_name,
        recordCount: backupData.metadata.totalRecords
      })
    });
  }

  return backupData;
};

// Restore farm profile from backup
export const restoreFarmProfile = async (farmProfile: any): Promise<void> => {
  const { data: existingProfile } = await supabase
    .from('farm_profiles')
    .select('id')
    .single();

  if (existingProfile) {
    await supabase
      .from('farm_profiles')
      .update({
        farm_name: farmProfile.farm_name,
        farm_logo_url: farmProfile.farm_logo_url,
        theme_primary_color: farmProfile.theme_primary_color,
        theme_secondary_color: farmProfile.theme_secondary_color,
        location_name: farmProfile.location_name,
        location_coordinates: farmProfile.location_coordinates
      })
      .eq('id', existingProfile.id);
  }
};
