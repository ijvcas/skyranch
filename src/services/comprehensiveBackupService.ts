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
  
  // Core Data
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
  
  // Financial Data
  financialData?: {
    animalSales: any[];
    salePayments: any[];
    farmLedger: any[];
    expenseCategories: any[];
    financialBudgets: any[];
  };
  
  // Inventory Data
  inventoryData?: {
    items: any[];
    transactions: any[];
    alerts: any[];
  };
  
  // Tasks Data
  tasksData?: {
    tasks: any[];
  };
  
  // User Management Data
  userManagementData?: {
    userRoles: any[];
    profiles: any[];
  };
  
  // Property Ownership Data
  parcelOwners?: any[];
  
  // System & Settings Data (NEW)
  systemData?: {
    aiSettings: any[];
    appVersion: any[];
    dashboardBanners: any[];
    farmProfiles: any[];
  };
  
  // Communication & Notifications Data (NEW)
  communicationData?: {
    chatHistory: any[];
    pushTokens: any[];
    localReminders: any[];
    emailAuditLog: any[];
  };
  
  // Barcode & Scanning Data (NEW)
  barcodeData?: {
    barcodeRegistry: any[];
    barcodeScanHistory: any[];
  };
  
  // Pedigree & Genetics Data (NEW)
  pedigreeData?: {
    pedigreeAnalyses: any[];
  };
  
  // Subscription Data (NEW)
  subscriptionData?: {
    subscriptions: any[];
    subscriptionUsage: any[];
  };
}

// ==================== EXISTING DATA FETCH FUNCTIONS ====================

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

// Animal attachments
export const getAllAnimalAttachments = async () => {
  const { data, error } = await supabase
    .from('animal_attachments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

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
    .select('*');
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

// ==================== NEW DATA FETCH FUNCTIONS ====================

// System & Settings Data
export const getAllSystemData = async () => {
  const { data: aiSettings, error: aiError } = await supabase
    .from('ai_settings')
    .select('*');
  if (aiError) console.error('Error fetching ai_settings:', aiError);

  const { data: appVersion, error: versionError } = await supabase
    .from('app_version')
    .select('*')
    .order('created_at', { ascending: false });
  if (versionError) console.error('Error fetching app_version:', versionError);

  const { data: dashboardBanners, error: bannersError } = await supabase
    .from('dashboard_banners')
    .select('*');
  if (bannersError) console.error('Error fetching dashboard_banners:', bannersError);

  const { data: farmProfiles, error: profilesError } = await supabase
    .from('farm_profiles')
    .select('*');
  if (profilesError) console.error('Error fetching farm_profiles:', profilesError);

  return {
    aiSettings: aiSettings || [],
    appVersion: appVersion || [],
    dashboardBanners: dashboardBanners || [],
    farmProfiles: farmProfiles || []
  };
};

// Communication & Notifications Data
export const getAllCommunicationData = async () => {
  const { data: chatHistory, error: chatError } = await supabase
    .from('chat_history')
    .select('*')
    .order('created_at', { ascending: false });
  if (chatError) console.error('Error fetching chat_history:', chatError);

  const { data: pushTokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('*');
  if (tokensError) console.error('Error fetching push_tokens:', tokensError);

  const { data: localReminders, error: remindersError } = await supabase
    .from('local_reminders')
    .select('*')
    .order('scheduled_date', { ascending: false });
  if (remindersError) console.error('Error fetching local_reminders:', remindersError);

  const { data: emailAuditLog, error: emailError } = await supabase
    .from('email_audit_log')
    .select('*')
    .order('created_at', { ascending: false });
  if (emailError) console.error('Error fetching email_audit_log:', emailError);

  return {
    chatHistory: chatHistory || [],
    pushTokens: pushTokens || [],
    localReminders: localReminders || [],
    emailAuditLog: emailAuditLog || []
  };
};

// Barcode & Scanning Data
export const getAllBarcodeData = async () => {
  const { data: barcodeRegistry, error: registryError } = await supabase
    .from('barcode_registry')
    .select('*')
    .order('created_at', { ascending: false });
  if (registryError) console.error('Error fetching barcode_registry:', registryError);

  const { data: barcodeScanHistory, error: historyError } = await supabase
    .from('barcode_scan_history')
    .select('*')
    .order('scanned_at', { ascending: false });
  if (historyError) console.error('Error fetching barcode_scan_history:', historyError);

  return {
    barcodeRegistry: barcodeRegistry || [],
    barcodeScanHistory: barcodeScanHistory || []
  };
};

// Pedigree & Genetics Data
export const getAllPedigreeData = async () => {
  const { data: pedigreeAnalyses, error: analysesError } = await supabase
    .from('pedigree_analyses')
    .select('*')
    .order('created_at', { ascending: false });
  if (analysesError) console.error('Error fetching pedigree_analyses:', analysesError);

  return {
    pedigreeAnalyses: pedigreeAnalyses || []
  };
};

// Subscription Data
export const getAllSubscriptionData = async () => {
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('*');
  if (subsError) console.error('Error fetching subscriptions:', subsError);

  const { data: subscriptionUsage, error: usageError } = await supabase
    .from('subscription_usage')
    .select('*');
  if (usageError) console.error('Error fetching subscription_usage:', usageError);

  return {
    subscriptions: subscriptions || [],
    subscriptionUsage: subscriptionUsage || []
  };
};

// ==================== IMPORT FUNCTIONS ====================

export const importLots = async (lotsData: any): Promise<number> => {
  let importCount = 0;

  if (lotsData.lots?.length) {
    const { error } = await supabase.from('lots').insert(lotsData.lots);
    if (!error) importCount += lotsData.lots.length;
    else console.error('Error importing lots:', error);
  }

  if (lotsData.polygons?.length) {
    const { error } = await supabase.from('lot_polygons').insert(lotsData.polygons);
    if (!error) importCount += lotsData.polygons.length;
    else console.error('Error importing lot_polygons:', error);
  }

  if (lotsData.assignments?.length) {
    const { error } = await supabase.from('animal_lot_assignments').insert(lotsData.assignments);
    if (!error) importCount += lotsData.assignments.length;
    else console.error('Error importing animal_lot_assignments:', error);
  }

  if (lotsData.rotations?.length) {
    const { error } = await supabase.from('lot_rotations').insert(lotsData.rotations);
    if (!error) importCount += lotsData.rotations.length;
    else console.error('Error importing lot_rotations:', error);
  }

  return importCount;
};

export const importCadastralData = async (cadastralData: any): Promise<number> => {
  let importCount = 0;

  if (cadastralData.properties?.length) {
    const { error } = await supabase.from('properties').insert(cadastralData.properties);
    if (!error) importCount += cadastralData.properties.length;
    else console.error('Error importing properties:', error);
  }

  if (cadastralData.parcels?.length) {
    const { error } = await supabase.from('cadastral_parcels').insert(cadastralData.parcels);
    if (!error) importCount += cadastralData.parcels.length;
    else console.error('Error importing cadastral_parcels:', error);
  }

  return importCount;
};

export const importHealthRecords = async (healthRecords: any[]): Promise<number> => {
  if (!healthRecords?.length) return 0;
  const { error } = await supabase.from('health_records').insert(healthRecords);
  if (error) console.error('Error importing health_records:', error);
  return error ? 0 : healthRecords.length;
};

export const importBreedingData = async (breedingData: any): Promise<number> => {
  let importCount = 0;

  if (breedingData.breedingRecords?.length) {
    const { error } = await supabase.from('breeding_records').insert(breedingData.breedingRecords);
    if (!error) importCount += breedingData.breedingRecords.length;
    else console.error('Error importing breeding_records:', error);
  }

  if (breedingData.offspring?.length) {
    const { error } = await supabase.from('offspring').insert(breedingData.offspring);
    if (!error) importCount += breedingData.offspring.length;
    else console.error('Error importing offspring:', error);
  }

  return importCount;
};

export const importCalendarData = async (calendarData: any): Promise<number> => {
  let importCount = 0;

  if (calendarData.events?.length) {
    const { error } = await supabase.from('calendar_events').insert(calendarData.events);
    if (!error) importCount += calendarData.events.length;
    else console.error('Error importing calendar_events:', error);
  }

  if (calendarData.eventNotifications?.length) {
    const { error } = await supabase.from('event_notifications').insert(calendarData.eventNotifications);
    if (!error) importCount += calendarData.eventNotifications.length;
    else console.error('Error importing event_notifications:', error);
  }

  return importCount;
};

export const importNotifications = async (notifications: any[]): Promise<number> => {
  if (!notifications?.length) return 0;
  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) console.error('Error importing notifications:', error);
  return error ? 0 : notifications.length;
};

export const importReports = async (reports: any[]): Promise<number> => {
  if (!reports?.length) return 0;
  const { error } = await supabase.from('reports').insert(reports);
  if (error) console.error('Error importing reports:', error);
  return error ? 0 : reports.length;
};

export const importAnimalAttachments = async (attachments: any[]): Promise<number> => {
  if (!attachments?.length) return 0;
  const { error } = await supabase.from('animal_attachments').insert(attachments);
  if (error) console.error('Error importing animal_attachments:', error);
  return error ? 0 : attachments.length;
};

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
  if (!tasksData.tasks?.length) return 0;
  const { error } = await supabase.from('tasks').insert(tasksData.tasks);
  if (error) console.error('Error importing tasks:', error);
  return error ? 0 : tasksData.tasks.length;
};

export const importUserManagementData = async (userManagementData: any): Promise<number> => {
  let importCount = 0;

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
  if (error) console.error('Error importing parcel_owners:', error);
  return error ? 0 : parcelOwners.length;
};

// ==================== NEW IMPORT FUNCTIONS ====================

export const importSystemData = async (systemData: any): Promise<number> => {
  let importCount = 0;

  if (systemData.aiSettings?.length) {
    const { error } = await supabase.from('ai_settings').insert(systemData.aiSettings);
    if (!error) importCount += systemData.aiSettings.length;
    else console.error('Error importing ai_settings:', error);
  }

  if (systemData.appVersion?.length) {
    const { error } = await supabase.from('app_version').insert(systemData.appVersion);
    if (!error) importCount += systemData.appVersion.length;
    else console.error('Error importing app_version:', error);
  }

  if (systemData.dashboardBanners?.length) {
    const { error } = await supabase.from('dashboard_banners').insert(systemData.dashboardBanners);
    if (!error) importCount += systemData.dashboardBanners.length;
    else console.error('Error importing dashboard_banners:', error);
  }

  if (systemData.farmProfiles?.length) {
    // For farm_profiles, we update existing rather than insert
    for (const profile of systemData.farmProfiles) {
      const { error } = await supabase.from('farm_profiles').upsert(profile);
      if (!error) importCount += 1;
      else console.error('Error importing farm_profile:', error);
    }
  }

  return importCount;
};

export const importCommunicationData = async (communicationData: any): Promise<number> => {
  let importCount = 0;

  if (communicationData.chatHistory?.length) {
    const { error } = await supabase.from('chat_history').insert(communicationData.chatHistory);
    if (!error) importCount += communicationData.chatHistory.length;
    else console.error('Error importing chat_history:', error);
  }

  if (communicationData.pushTokens?.length) {
    const { error } = await supabase.from('push_tokens').insert(communicationData.pushTokens);
    if (!error) importCount += communicationData.pushTokens.length;
    else console.error('Error importing push_tokens:', error);
  }

  if (communicationData.localReminders?.length) {
    const { error } = await supabase.from('local_reminders').insert(communicationData.localReminders);
    if (!error) importCount += communicationData.localReminders.length;
    else console.error('Error importing local_reminders:', error);
  }

  if (communicationData.emailAuditLog?.length) {
    const { error } = await supabase.from('email_audit_log').insert(communicationData.emailAuditLog);
    if (!error) importCount += communicationData.emailAuditLog.length;
    else console.error('Error importing email_audit_log:', error);
  }

  return importCount;
};

export const importBarcodeData = async (barcodeData: any): Promise<number> => {
  let importCount = 0;

  if (barcodeData.barcodeRegistry?.length) {
    const { error } = await supabase.from('barcode_registry').insert(barcodeData.barcodeRegistry);
    if (!error) importCount += barcodeData.barcodeRegistry.length;
    else console.error('Error importing barcode_registry:', error);
  }

  if (barcodeData.barcodeScanHistory?.length) {
    const { error } = await supabase.from('barcode_scan_history').insert(barcodeData.barcodeScanHistory);
    if (!error) importCount += barcodeData.barcodeScanHistory.length;
    else console.error('Error importing barcode_scan_history:', error);
  }

  return importCount;
};

export const importPedigreeData = async (pedigreeData: any): Promise<number> => {
  if (!pedigreeData.pedigreeAnalyses?.length) return 0;
  const { error } = await supabase.from('pedigree_analyses').insert(pedigreeData.pedigreeAnalyses);
  if (error) console.error('Error importing pedigree_analyses:', error);
  return error ? 0 : pedigreeData.pedigreeAnalyses.length;
};

export const importSubscriptionData = async (subscriptionData: any): Promise<number> => {
  let importCount = 0;

  if (subscriptionData.subscriptions?.length) {
    const { error } = await supabase.from('subscriptions').upsert(subscriptionData.subscriptions);
    if (!error) importCount += subscriptionData.subscriptions.length;
    else console.error('Error importing subscriptions:', error);
  }

  if (subscriptionData.subscriptionUsage?.length) {
    const { error } = await supabase.from('subscription_usage').upsert(subscriptionData.subscriptionUsage);
    if (!error) importCount += subscriptionData.subscriptionUsage.length;
    else console.error('Error importing subscription_usage:', error);
  }

  return importCount;
};

// ==================== HELPER FUNCTIONS ====================

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

// Create comprehensive backup with ALL data
export const createBackup = async (storageType: 'local' | 'icloud' = 'local'): Promise<ComprehensiveBackupData> => {
  const farmProfile = await getFarmProfile();
  const users = await getAllUsers();
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
  const financialData = await getAllFinancialData();
  const inventoryData = await getAllInventoryData();
  const tasksData = await getAllTasksData();
  const userManagementData = await getAllUserManagementData();
  const parcelOwners = await getAllParcelOwners();
  
  // NEW data categories
  const systemData = await getAllSystemData();
  const communicationData = await getAllCommunicationData();
  const barcodeData = await getAllBarcodeData();
  const pedigreeData = await getAllPedigreeData();
  const subscriptionData = await getAllSubscriptionData();

  const totalRecords = 
    users.length + animals.length + fieldReports.length + 
    lotsData.lots.length + lotsData.polygons.length + lotsData.assignments.length + lotsData.rotations.length +
    cadastralData.parcels.length + cadastralData.properties.length +
    healthRecords.length + breedingData.breedingRecords.length + breedingData.offspring.length +
    calendarData.events.length + calendarData.eventNotifications.length +
    notifications.length + reports.length + attachments.length +
    financialData.animalSales.length + financialData.salePayments.length + 
    financialData.farmLedger.length + financialData.expenseCategories.length + financialData.financialBudgets.length +
    inventoryData.items.length + inventoryData.transactions.length + inventoryData.alerts.length +
    tasksData.tasks.length +
    userManagementData.userRoles.length + userManagementData.profiles.length +
    parcelOwners.length +
    systemData.aiSettings.length + systemData.appVersion.length + systemData.dashboardBanners.length + systemData.farmProfiles.length +
    communicationData.chatHistory.length + communicationData.pushTokens.length + communicationData.localReminders.length + communicationData.emailAuditLog.length +
    barcodeData.barcodeRegistry.length + barcodeData.barcodeScanHistory.length +
    pedigreeData.pedigreeAnalyses.length +
    subscriptionData.subscriptions.length + subscriptionData.subscriptionUsage.length;

  const backupData: ComprehensiveBackupData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '4.0.0',
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
    parcelOwners,
    systemData,
    communicationData,
    barcodeData,
    pedigreeData,
    subscriptionData
  };

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
