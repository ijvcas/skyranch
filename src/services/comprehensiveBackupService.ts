
import { supabase } from '@/integrations/supabase/client';
import { getAllUsers } from './userService';
import { getAllAnimals } from './animalService';
import { getAllFieldReports, importFieldReports } from './fieldReportBackupService';

export interface ComprehensiveBackupData {
  metadata: {
    exportDate: string;
    version: string;
    selectedCategories: string[];
    totalRecords: number;
    checksum?: string;
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
