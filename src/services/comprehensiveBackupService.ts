import { supabase } from '@/integrations/supabase/client';
import { getAllUsers } from './userService';
import { getAllAnimalsForBackup } from './animal/animalBackupQueries';
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
  
  // NEW: Financial Data
  financialData?: {
    animalSales: any[];
    salePayments: any[];
    farmLedger: any[];
    expenseCategories: any[];
    financialBudgets: any[];
  };
  
  // NEW: Inventory Data
  inventoryData?: {
    items: any[];
    transactions: any[];
    alerts: any[];
  };
  
  // NEW: Tasks Data
  tasksData?: {
    tasks: any[];
  };
  
  // NEW: User Management Data
  userManagementData?: {
    userRoles: any[];
    profiles: any[];
  };
  
  // NEW: Property Ownership Data
  parcelOwners?: any[];
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

// Animal attachments (document metadata)
export const getAllAnimalAttachments = async () => {
  const { data, error } = await supabase
    .from('animal_attachments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ==================== NEW DATA FETCH FUNCTIONS ====================

// Financial Data
export const getAllFinancialData = async () => {
  const { data: animalSales, error: salesError } = await supabase
    .from('animal_sales')
    .select('*')
    .order('created_at', { ascending: false });
  if (salesError) console.error('Error fetching animal_sales:', salesError);

  const { data: salePayments, error: paymentsError } = await supabase
    .from('sale_payments')
    .select('*')
    .order('created_at', { ascending: false });
  if (paymentsError) console.error('Error fetching sale_payments:', paymentsError);

  const { data: farmLedger, error: ledgerError } = await supabase
    .from('farm_ledger')
    .select('*')
    .order('created_at', { ascending: false });
  if (ledgerError) console.error('Error fetching farm_ledger:', ledgerError);

  const { data: expenseCategories, error: categoriesError } = await supabase
    .from('expense_categories')
    .select('*')
    .order('created_at', { ascending: false });
  if (categoriesError) console.error('Error fetching expense_categories:', categoriesError);

  const { data: financialBudgets, error: budgetsError } = await supabase
    .from('financial_budgets')
    .select('*')
    .order('created_at', { ascending: false });
  if (budgetsError) console.error('Error fetching financial_budgets:', budgetsError);

  return {
    animalSales: animalSales || [],
    salePayments: salePayments || [],
    farmLedger: farmLedger || [],
    expenseCategories: expenseCategories || [],
    financialBudgets: financialBudgets || []
  };
};

// Inventory Data
export const getAllInventoryData = async () => {
  const { data: items, error: itemsError } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (itemsError) console.error('Error fetching inventory_items:', itemsError);

  const { data: transactions, error: transactionsError } = await supabase
    .from('inventory_transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (transactionsError) console.error('Error fetching inventory_transactions:', transactionsError);

  const { data: alerts, error: alertsError } = await supabase
    .from('inventory_alerts')
    .select('*')
    .order('triggered_at', { ascending: false });
  if (alertsError) console.error('Error fetching inventory_alerts:', alertsError);

  return {
    items: items || [],
    transactions: transactions || [],
    alerts: alerts || []
  };
};

// Tasks Data
export const getAllTasksData = async () => {
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (tasksError) console.error('Error fetching tasks:', tasksError);

  return {
    tasks: tasks || []
  };
};

// User Management Data
export const getAllUserManagementData = async () => {
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');
  if (rolesError) console.error('Error fetching user_roles:', rolesError);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  if (profilesError) console.error('Error fetching profiles:', profilesError);

  return {
    userRoles: userRoles || [],
    profiles: profiles || []
  };
};

// Parcel Owners
export const getAllParcelOwners = async () => {
  const { data, error } = await supabase
    .from('parcel_owners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching parcel_owners:', error);
  return data || [];
};

// ==================== IMPORT FUNCTIONS ====================

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

export const importAnimalAttachments = async (attachments: any[]): Promise<number> => {
  if (!attachments || attachments.length === 0) return 0;
  
  // Note: This only imports metadata, not the actual files from storage
  const { error } = await supabase.from('animal_attachments').insert(attachments);
  return error ? 0 : attachments.length;
};

// ==================== NEW IMPORT FUNCTIONS ====================

export const importFinancialData = async (financialData: any): Promise<number> => {
  let importCount = 0;

  if (financialData.expenseCategories?.length) {
    const { error } = await supabase.from('expense_categories').insert(financialData.expenseCategories);
    if (!error) importCount += financialData.expenseCategories.length;
    else console.error('Error importing expense_categories:', error);
  }

  if (financialData.animalSales?.length) {
    const { error } = await supabase.from('animal_sales').insert(financialData.animalSales);
    if (!error) importCount += financialData.animalSales.length;
    else console.error('Error importing animal_sales:', error);
  }

  if (financialData.salePayments?.length) {
    const { error } = await supabase.from('sale_payments').insert(financialData.salePayments);
    if (!error) importCount += financialData.salePayments.length;
    else console.error('Error importing sale_payments:', error);
  }

  if (financialData.farmLedger?.length) {
    const { error } = await supabase.from('farm_ledger').insert(financialData.farmLedger);
    if (!error) importCount += financialData.farmLedger.length;
    else console.error('Error importing farm_ledger:', error);
  }

  if (financialData.financialBudgets?.length) {
    const { error } = await supabase.from('financial_budgets').insert(financialData.financialBudgets);
    if (!error) importCount += financialData.financialBudgets.length;
    else console.error('Error importing financial_budgets:', error);
  }

  return importCount;
};

export const importInventoryData = async (inventoryData: any): Promise<number> => {
  let importCount = 0;

  if (inventoryData.items?.length) {
    const { error } = await supabase.from('inventory_items').insert(inventoryData.items);
    if (!error) importCount += inventoryData.items.length;
    else console.error('Error importing inventory_items:', error);
  }

  if (inventoryData.transactions?.length) {
    const { error } = await supabase.from('inventory_transactions').insert(inventoryData.transactions);
    if (!error) importCount += inventoryData.transactions.length;
    else console.error('Error importing inventory_transactions:', error);
  }

  if (inventoryData.alerts?.length) {
    const { error } = await supabase.from('inventory_alerts').insert(inventoryData.alerts);
    if (!error) importCount += inventoryData.alerts.length;
    else console.error('Error importing inventory_alerts:', error);
  }

  return importCount;
};

export const importTasksData = async (tasksData: any): Promise<number> => {
  let importCount = 0;

  if (tasksData.tasks?.length) {
    const { error } = await supabase.from('tasks').insert(tasksData.tasks);
    if (!error) importCount += tasksData.tasks.length;
    else console.error('Error importing tasks:', error);
  }

  return importCount;
};

export const importUserManagementData = async (userManagementData: any): Promise<number> => {
  let importCount = 0;

  // Import profiles first (as user_roles may depend on them)
  if (userManagementData.profiles?.length) {
    const { error } = await supabase.from('profiles').insert(userManagementData.profiles);
    if (!error) importCount += userManagementData.profiles.length;
    else console.error('Error importing profiles:', error);
  }

  if (userManagementData.userRoles?.length) {
    const { error } = await supabase.from('user_roles').insert(userManagementData.userRoles);
    if (!error) importCount += userManagementData.userRoles.length;
    else console.error('Error importing user_roles:', error);
  }

  return importCount;
};

export const importParcelOwners = async (parcelOwners: any[]): Promise<number> => {
  if (!parcelOwners?.length) return 0;
  
  const { error } = await supabase.from('parcel_owners').insert(parcelOwners);
  if (error) {
    console.error('Error importing parcel_owners:', error);
    return 0;
  }
  return parcelOwners.length;
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
  // Use optimized backup query that excludes empty genealogy fields beyond pedigree_max_generation
  const animals = await getAllAnimalsForBackup(true);
  const fieldReports = await getAllFieldReports();
  const lotsData = await getAllLots();
  const cadastralData = await getAllCadastralData();
  const healthRecords = await getAllHealthRecords();
  const breedingData = await getAllBreedingData();
  const calendarData = await getAllCalendarData();
  const notifications = await getAllNotifications();
  const reports = await getAllReports();
  const attachments = await getAllAnimalAttachments();
  
  // NEW data categories
  const financialData = await getAllFinancialData();
  const inventoryData = await getAllInventoryData();
  const tasksData = await getAllTasksData();
  const userManagementData = await getAllUserManagementData();
  const parcelOwners = await getAllParcelOwners();

  const totalRecords = users.length + animals.length + fieldReports.length + 
    lotsData.lots.length + cadastralData.parcels.length + healthRecords.length +
    breedingData.breedingRecords.length + calendarData.events.length +
    financialData.animalSales.length + financialData.farmLedger.length +
    inventoryData.items.length + tasksData.tasks.length + parcelOwners.length;

  const backupData: ComprehensiveBackupData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '3.0.0',
      platform: 'ios',
      appVersion: '1.0.0',
      selectedCategories: ['all'],
      totalRecords
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
    animalAttachments: attachments,
    financialData,
    inventoryData,
    tasksData,
    userManagementData,
    parcelOwners
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
