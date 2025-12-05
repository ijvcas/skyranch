import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Database, Users, FileText, Calendar, Shield, MapPin, Heart, Clipboard, Bell, BarChart3, Cloud, DollarSign, Package, CheckSquare, UserCog, Home, Settings, MessageSquare, Scan, Dna, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { iCloudBackupService } from '@/services/native/iCloudBackupService';
import BackupFileBrowser from './BackupFileBrowser';
import { useTranslation } from 'react-i18next';
import { getAllUsers } from '@/services/userService';
import { getAllAnimalsForBackup } from '@/services/animal/animalBackupQueries';
import { getAllFieldReports, importFieldReports } from '@/services/fieldReportBackupService';
import { 
  getAllLots, 
  getAllCadastralData, 
  getAllHealthRecords, 
  getAllBreedingData, 
  getAllCalendarData, 
  getAllNotifications, 
  getAllReports,
  getAllFinancialData,
  getAllInventoryData,
  getAllTasksData,
  getAllUserManagementData,
  getAllParcelOwners,
  getAllSystemData,
  getAllCommunicationData,
  getAllBarcodeData,
  getAllPedigreeData,
  getAllSubscriptionData,
  importLots,
  importCadastralData,
  importHealthRecords,
  importBreedingData,
  importCalendarData,
  importNotifications,
  importReports,
  importFinancialData,
  importInventoryData,
  importTasksData,
  importUserManagementData,
  importParcelOwners,
  importSystemData,
  importCommunicationData,
  importBarcodeData,
  importPedigreeData,
  importSubscriptionData,
  type ComprehensiveBackupData
} from '@/services/comprehensiveBackupService';

interface BackupData {
  users: boolean;
  animals: boolean;
  fieldReports: boolean;
  lots: boolean;
  cadastralData: boolean;
  healthRecords: boolean;
  breedingRecords: boolean;
  calendarEvents: boolean;
  notifications: boolean;
  reports: boolean;
  financialData: boolean;
  inventoryData: boolean;
  tasksData: boolean;
  userManagement: boolean;
  parcelOwners: boolean;
  // NEW categories
  systemData: boolean;
  communicationData: boolean;
  barcodeData: boolean;
  pedigreeData: boolean;
  subscriptionData: boolean;
}

const SystemBackupManager: React.FC = () => {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [nativeBackupContent, setNativeBackupContent] = useState<string | null>(null);
  const [nativeBackupFileName, setNativeBackupFileName] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedData, setSelectedData] = useState<BackupData>({
    users: true,
    animals: true,
    fieldReports: true,
    lots: true,
    cadastralData: true,
    healthRecords: true,
    breedingRecords: true,
    calendarEvents: true,
    notifications: true,
    reports: true,
    financialData: true,
    inventoryData: true,
    tasksData: true,
    userManagement: true,
    parcelOwners: true,
    // NEW categories default to true
    systemData: true,
    communicationData: true,
    barcodeData: true,
    pedigreeData: true,
    subscriptionData: true,
  });

  // Get data for export with actual counts
  const { data: users = [] } = useQuery({
    queryKey: ['backup-users'],
    queryFn: getAllUsers,
    enabled: selectedData.users,
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['backup-animals-optimized'],
    queryFn: () => getAllAnimalsForBackup(true),
    enabled: selectedData.animals,
    staleTime: 0,
  });

  const { data: fieldReports = [] } = useQuery({
    queryKey: ['backup-field-reports'],
    queryFn: getAllFieldReports,
    enabled: selectedData.fieldReports,
  });

  const { data: lotsData } = useQuery({
    queryKey: ['backup-lots'],
    queryFn: getAllLots,
    enabled: selectedData.lots,
  });

  const { data: cadastralData } = useQuery({
    queryKey: ['backup-cadastral'],
    queryFn: getAllCadastralData,
    enabled: selectedData.cadastralData,
  });

  const { data: healthRecords = [] } = useQuery({
    queryKey: ['backup-health'],
    queryFn: getAllHealthRecords,
    enabled: selectedData.healthRecords,
  });

  const { data: breedingData } = useQuery({
    queryKey: ['backup-breeding'],
    queryFn: getAllBreedingData,
    enabled: selectedData.breedingRecords,
  });

  const { data: calendarData } = useQuery({
    queryKey: ['backup-calendar'],
    queryFn: getAllCalendarData,
    enabled: selectedData.calendarEvents,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['backup-notifications'],
    queryFn: getAllNotifications,
    enabled: selectedData.notifications,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['backup-reports'],
    queryFn: getAllReports,
    enabled: selectedData.reports,
  });

  const { data: financialData } = useQuery({
    queryKey: ['backup-financial'],
    queryFn: getAllFinancialData,
    enabled: selectedData.financialData,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['backup-inventory'],
    queryFn: getAllInventoryData,
    enabled: selectedData.inventoryData,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['backup-tasks'],
    queryFn: getAllTasksData,
    enabled: selectedData.tasksData,
  });

  const { data: userManagementData } = useQuery({
    queryKey: ['backup-user-management'],
    queryFn: getAllUserManagementData,
    enabled: selectedData.userManagement,
  });

  const { data: parcelOwners = [] } = useQuery({
    queryKey: ['backup-parcel-owners'],
    queryFn: getAllParcelOwners,
    enabled: selectedData.parcelOwners,
  });

  // NEW data queries
  const { data: systemData } = useQuery({
    queryKey: ['backup-system'],
    queryFn: getAllSystemData,
    enabled: selectedData.systemData,
  });

  const { data: communicationData } = useQuery({
    queryKey: ['backup-communication'],
    queryFn: getAllCommunicationData,
    enabled: selectedData.communicationData,
  });

  const { data: barcodeData } = useQuery({
    queryKey: ['backup-barcode'],
    queryFn: getAllBarcodeData,
    enabled: selectedData.barcodeData,
  });

  const { data: pedigreeData } = useQuery({
    queryKey: ['backup-pedigree'],
    queryFn: getAllPedigreeData,
    enabled: selectedData.pedigreeData,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['backup-subscription'],
    queryFn: getAllSubscriptionData,
    enabled: selectedData.subscriptionData,
  });

  // Count helper functions
  const getLotsCount = () => {
    if (!lotsData) return 0;
    return (lotsData.lots?.length || 0) + (lotsData.polygons?.length || 0) + 
           (lotsData.assignments?.length || 0) + (lotsData.rotations?.length || 0);
  };

  const getCadastralCount = () => {
    if (!cadastralData) return 0;
    return (cadastralData.parcels?.length || 0) + (cadastralData.properties?.length || 0);
  };

  const getBreedingCount = () => {
    if (!breedingData) return 0;
    return (breedingData.breedingRecords?.length || 0) + (breedingData.offspring?.length || 0);
  };

  const getCalendarCount = () => {
    if (!calendarData) return 0;
    return (calendarData.events?.length || 0) + (calendarData.eventNotifications?.length || 0);
  };

  const getFinancialCount = () => {
    if (!financialData) return 0;
    return (financialData.animalSales?.length || 0) + (financialData.salePayments?.length || 0) + 
           (financialData.farmLedger?.length || 0) + (financialData.expenseCategories?.length || 0) + 
           (financialData.financialBudgets?.length || 0);
  };

  const getInventoryCount = () => {
    if (!inventoryData) return 0;
    return (inventoryData.items?.length || 0) + (inventoryData.transactions?.length || 0) + 
           (inventoryData.alerts?.length || 0);
  };

  const getTasksCount = () => tasksData?.tasks?.length || 0;

  const getUserManagementCount = () => {
    if (!userManagementData) return 0;
    return (userManagementData.profiles?.length || 0) + (userManagementData.emergencyContacts?.length || 0) + 
           (userManagementData.userInvitations?.length || 0) + (userManagementData.connectionLogs?.length || 0);
  };

  const getSystemCount = () => {
    if (!systemData) return 0;
    return (systemData.aiSettings?.length || 0) + (systemData.appVersion?.length || 0) + 
           (systemData.dashboardBanners?.length || 0) + (systemData.farmProfiles?.length || 0);
  };

  const getCommunicationCount = () => {
    if (!communicationData) return 0;
    return (communicationData.chatHistory?.length || 0) + (communicationData.pushTokens?.length || 0) + 
           (communicationData.localReminders?.length || 0) + (communicationData.emailAuditLog?.length || 0);
  };

  const getBarcodeCount = () => {
    if (!barcodeData) return 0;
    return (barcodeData.barcodeRegistry?.length || 0) + (barcodeData.barcodeScanHistory?.length || 0);
  };

  const getPedigreeCount = () => pedigreeData?.pedigreeAnalyses?.length || 0;

  const getSubscriptionCount = () => {
    if (!subscriptionData) return 0;
    return (subscriptionData.subscriptions?.length || 0) + (subscriptionData.subscriptionUsage?.length || 0);
  };

  const backupCategories = [
    { key: 'users', label: t('backup.categories.users', 'Users'), icon: Users, description: t('backup.descriptions.users', 'App users and permissions'), count: users.length },
    { key: 'animals', label: t('backup.categories.animals', 'Animals'), icon: Database, description: t('backup.descriptions.animals', 'All animal records'), count: animals.length },
    { key: 'fieldReports', label: t('backup.categories.fieldReports', 'Field Reports'), icon: Clipboard, description: t('backup.descriptions.fieldReports', 'Daily field reports'), count: fieldReports.length },
    { key: 'lots', label: t('backup.categories.lots', 'Lots'), icon: MapPin, description: t('backup.descriptions.lots', 'Lots, polygons, assignments, rotations'), count: getLotsCount() },
    { key: 'cadastralData', label: t('backup.categories.cadastralData', 'Cadastral Data'), icon: Shield, description: t('backup.descriptions.cadastralData', 'Parcels and properties'), count: getCadastralCount() },
    { key: 'healthRecords', label: t('backup.categories.healthRecords', 'Health Records'), icon: Heart, description: t('backup.descriptions.healthRecords', 'Vaccinations, treatments'), count: healthRecords.length },
    { key: 'breedingRecords', label: t('backup.categories.breedingRecords', 'Breeding Records'), icon: FileText, description: t('backup.descriptions.breedingRecords', 'Breeding and offspring'), count: getBreedingCount() },
    { key: 'calendarEvents', label: t('backup.categories.calendarEvents', 'Calendar Events'), icon: Calendar, description: t('backup.descriptions.calendarEvents', 'Events and reminders'), count: getCalendarCount() },
    { key: 'notifications', label: t('backup.categories.notifications', 'Notifications'), icon: Bell, description: t('backup.descriptions.notifications', 'System notifications'), count: notifications.length },
    { key: 'reports', label: t('backup.categories.reports', 'Reports'), icon: BarChart3, description: t('backup.descriptions.reports', 'Saved reports'), count: reports.length },
    { key: 'financialData', label: t('backup.categories.financialData', 'Financial Data'), icon: DollarSign, description: t('backup.descriptions.financialData', 'Sales, payments, ledger, budgets'), count: getFinancialCount() },
    { key: 'inventoryData', label: t('backup.categories.inventoryData', 'Inventory'), icon: Package, description: t('backup.descriptions.inventoryData', 'Items, transactions, alerts'), count: getInventoryCount() },
    { key: 'tasksData', label: t('backup.categories.tasksData', 'Tasks'), icon: CheckSquare, description: t('backup.descriptions.tasksData', 'Task management'), count: getTasksCount() },
    { key: 'userManagement', label: t('backup.categories.userManagement', 'User Management'), icon: UserCog, description: t('backup.descriptions.userManagement', 'Roles and profiles'), count: getUserManagementCount() },
    { key: 'parcelOwners', label: t('backup.categories.parcelOwners', 'Property Ownership'), icon: Home, description: t('backup.descriptions.parcelOwners', 'Parcel owners'), count: parcelOwners.length },
    // NEW CATEGORIES
    { key: 'systemData', label: t('backup.categories.systemData', 'System Settings'), icon: Settings, description: t('backup.descriptions.systemData', 'AI settings, app version, farm profiles'), count: getSystemCount() },
    { key: 'communicationData', label: t('backup.categories.communicationData', 'Communication'), icon: MessageSquare, description: t('backup.descriptions.communicationData', 'Chat, push tokens, reminders, emails'), count: getCommunicationCount() },
    { key: 'barcodeData', label: t('backup.categories.barcodeData', 'Barcode Data'), icon: Scan, description: t('backup.descriptions.barcodeData', 'Barcode registry and scan history'), count: getBarcodeCount() },
    { key: 'pedigreeData', label: t('backup.categories.pedigreeData', 'Pedigree Analysis'), icon: Dna, description: t('backup.descriptions.pedigreeData', 'Pedigree analyses'), count: getPedigreeCount() },
    { key: 'subscriptionData', label: t('backup.categories.subscriptionData', 'Subscriptions'), icon: CreditCard, description: t('backup.descriptions.subscriptionData', 'Subscription and usage data'), count: getSubscriptionCount() },
  ];

  const handleDataSelectionChange = (category: keyof BackupData, checked: boolean) => {
    setSelectedData(prev => ({ ...prev, [category]: checked }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setImportFile(event.target.files[0]);
    }
  };

  const simulateProgress = (callback: () => void) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => { callback(); setProgress(100); setTimeout(() => setProgress(0), 2000); }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const calculateTotalRecords = (): number => {
    let total = 0;
    if (selectedData.users) total += users.length;
    if (selectedData.animals) total += animals.length;
    if (selectedData.fieldReports) total += fieldReports.length;
    if (selectedData.lots) total += getLotsCount();
    if (selectedData.cadastralData) total += getCadastralCount();
    if (selectedData.healthRecords) total += healthRecords.length;
    if (selectedData.breedingRecords) total += getBreedingCount();
    if (selectedData.calendarEvents) total += getCalendarCount();
    if (selectedData.notifications) total += notifications.length;
    if (selectedData.reports) total += reports.length;
    if (selectedData.financialData) total += getFinancialCount();
    if (selectedData.inventoryData) total += getInventoryCount();
    if (selectedData.tasksData) total += getTasksCount();
    if (selectedData.userManagement) total += getUserManagementCount();
    if (selectedData.parcelOwners) total += parcelOwners.length;
    if (selectedData.systemData) total += getSystemCount();
    if (selectedData.communicationData) total += getCommunicationCount();
    if (selectedData.barcodeData) total += getBarcodeCount();
    if (selectedData.pedigreeData) total += getPedigreeCount();
    if (selectedData.subscriptionData) total += getSubscriptionCount();
    return total;
  };

  const handleExport = async () => {
    console.log('🚀 Starting FULL backup export...');
    setIsExporting(true);
    
    simulateProgress(async () => {
      try {
        const totalRecords = calculateTotalRecords();
        const selectedCategories = Object.keys(selectedData).filter(key => selectedData[key as keyof BackupData]);
        
        const backupData: ComprehensiveBackupData = {
          metadata: {
            exportDate: new Date().toISOString(),
            version: '4.0.0',
            platform: 'ios',
            appVersion: '1.0.0',
            selectedCategories,
            totalRecords
          }
        };

        // Add ALL selected data categories
        if (selectedData.users) backupData.users = users;
        if (selectedData.animals) backupData.animals = animals;
        if (selectedData.fieldReports) backupData.fieldReports = fieldReports;
        if (selectedData.lots && lotsData) backupData.lots = [lotsData];
        if (selectedData.cadastralData && cadastralData) backupData.cadastralParcels = [cadastralData];
        if (selectedData.healthRecords) backupData.healthRecords = healthRecords;
        if (selectedData.breedingRecords && breedingData) backupData.breedingRecords = [breedingData];
        if (selectedData.calendarEvents && calendarData) backupData.calendarEvents = [calendarData];
        if (selectedData.notifications) backupData.notifications = notifications;
        if (selectedData.reports) backupData.reports = reports;
        if (selectedData.financialData && financialData) backupData.financialData = financialData;
        if (selectedData.inventoryData && inventoryData) backupData.inventoryData = inventoryData;
        if (selectedData.tasksData && tasksData) backupData.tasksData = tasksData;
        if (selectedData.userManagement && userManagementData) backupData.userManagementData = userManagementData;
        if (selectedData.parcelOwners) backupData.parcelOwners = parcelOwners;
        // NEW data categories
        if (selectedData.systemData && systemData) backupData.systemData = systemData;
        if (selectedData.communicationData && communicationData) backupData.communicationData = communicationData;
        if (selectedData.barcodeData && barcodeData) backupData.barcodeData = barcodeData;
        if (selectedData.pedigreeData && pedigreeData) backupData.pedigreeData = pedigreeData;
        if (selectedData.subscriptionData && subscriptionData) backupData.subscriptionData = subscriptionData;

        const dataStr = JSON.stringify(backupData, null, 2);
        const backupSizeMB = (dataStr.length / 1024 / 1024).toFixed(2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const exportFileName = `skyranch_full_backup_${timestamp}_${totalRecords}records.json`;
        
        console.log(`💾 Creating backup: ${exportFileName} (${backupSizeMB} MB, ${totalRecords} records)`);

        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
          await Filesystem.writeFile({
            path: exportFileName,
            data: dataStr,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });
          toast({ title: t('backup.messages.exportComplete'), description: `${exportFileName} (${backupSizeMB} MB)` });
        } else {
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileName);
          document.body.appendChild(linkElement);
          linkElement.click();
          document.body.removeChild(linkElement);
          toast({ title: t('backup.messages.exportComplete'), description: `${totalRecords} records (${backupSizeMB} MB)` });
        }
      } catch (error) {
        console.error('Export error:', error);
        toast({ title: 'Export Error', description: String(error), variant: "destructive" });
      } finally {
        setIsExporting(false);
      }
    });
  };

  const handleNativeBackupSelected = (content: string, fileName: string) => {
    setNativeBackupContent(content);
    setNativeBackupFileName(fileName);
    toast({ title: 'File Selected', description: fileName });
  };

  const handleImport = () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative && !importFile) {
      toast({ title: t('backup.messages.selectFileFirst'), description: t('backup.messages.selectFileDesc'), variant: "destructive" });
      return;
    }
    
    if (isNative && !nativeBackupContent && !importFile) {
      toast({ title: t('backup.messages.selectFileFirst'), description: t('backup.messages.selectFileDesc'), variant: "destructive" });
      return;
    }

    setIsImporting(true);

    simulateProgress(async () => {
      try {
        let text: string;
        
        if (isNative && nativeBackupContent) {
          text = nativeBackupContent;
        } else if (importFile) {
          text = await importFile.text();
        } else {
          throw new Error("No backup source available");
        }
        
        const backupData: ComprehensiveBackupData = JSON.parse(text);

        if (!backupData.metadata || !backupData.metadata.version) {
          throw new Error("Invalid backup file - missing metadata");
        }

        console.log('📦 Importing backup:', backupData.metadata);

        let totalImported = 0;

        // Import all data categories
        if (backupData.fieldReports && selectedData.fieldReports) {
          totalImported += await importFieldReports(backupData.fieldReports);
        }
        if (backupData.lots && selectedData.lots && Array.isArray(backupData.lots) && backupData.lots.length > 0) {
          totalImported += await importLots(backupData.lots[0]);
        }
        if (backupData.cadastralParcels && selectedData.cadastralData && Array.isArray(backupData.cadastralParcels) && backupData.cadastralParcels.length > 0) {
          totalImported += await importCadastralData(backupData.cadastralParcels[0]);
        }
        if (backupData.healthRecords && selectedData.healthRecords) {
          totalImported += await importHealthRecords(backupData.healthRecords);
        }
        if (backupData.breedingRecords && selectedData.breedingRecords && Array.isArray(backupData.breedingRecords) && backupData.breedingRecords.length > 0) {
          totalImported += await importBreedingData(backupData.breedingRecords[0]);
        }
        if (backupData.calendarEvents && selectedData.calendarEvents && Array.isArray(backupData.calendarEvents) && backupData.calendarEvents.length > 0) {
          totalImported += await importCalendarData(backupData.calendarEvents[0]);
        }
        if (backupData.notifications && selectedData.notifications) {
          totalImported += await importNotifications(backupData.notifications);
        }
        if (backupData.reports && selectedData.reports) {
          totalImported += await importReports(backupData.reports);
        }
        if (backupData.financialData && selectedData.financialData) {
          totalImported += await importFinancialData(backupData.financialData);
        }
        if (backupData.inventoryData && selectedData.inventoryData) {
          totalImported += await importInventoryData(backupData.inventoryData);
        }
        if (backupData.tasksData && selectedData.tasksData) {
          totalImported += await importTasksData(backupData.tasksData);
        }
        if (backupData.userManagementData && selectedData.userManagement) {
          totalImported += await importUserManagementData(backupData.userManagementData);
        }
        if (backupData.parcelOwners && selectedData.parcelOwners) {
          totalImported += await importParcelOwners(backupData.parcelOwners);
        }
        // NEW imports
        if (backupData.systemData && selectedData.systemData) {
          totalImported += await importSystemData(backupData.systemData);
        }
        if (backupData.communicationData && selectedData.communicationData) {
          totalImported += await importCommunicationData(backupData.communicationData);
        }
        if (backupData.barcodeData && selectedData.barcodeData) {
          totalImported += await importBarcodeData(backupData.barcodeData);
        }
        if (backupData.pedigreeData && selectedData.pedigreeData) {
          totalImported += await importPedigreeData(backupData.pedigreeData);
        }
        if (backupData.subscriptionData && selectedData.subscriptionData) {
          totalImported += await importSubscriptionData(backupData.subscriptionData);
        }

        toast({ title: t('backup.messages.importComplete'), description: `${totalImported} records imported` });

      } catch (error: any) {
        console.error("Import error:", error);
        toast({ title: 'Import Error', description: error.message, variant: "destructive" });
      } finally {
        setIsImporting(false);
        setImportFile(null);
        setNativeBackupContent(null);
        setNativeBackupFileName(null);
      }
    });
  };

  const getTotalSelectedRecords = (): number => {
    return backupCategories.filter(cat => selectedData[cat.key as keyof BackupData]).reduce((total, cat) => total + cat.count, 0);
  };

  const selectAll = () => {
    setSelectedData({
      users: true, animals: true, fieldReports: true, lots: true, cadastralData: true,
      healthRecords: true, breedingRecords: true, calendarEvents: true, notifications: true,
      reports: true, financialData: true, inventoryData: true, tasksData: true,
      userManagement: true, parcelOwners: true, systemData: true, communicationData: true,
      barcodeData: true, pedigreeData: true, subscriptionData: true,
    });
  };

  const deselectAll = () => {
    setSelectedData({
      users: false, animals: false, fieldReports: false, lots: false, cadastralData: false,
      healthRecords: false, breedingRecords: false, calendarEvents: false, notifications: false,
      reports: false, financialData: false, inventoryData: false, tasksData: false,
      userManagement: false, parcelOwners: false, systemData: false, communicationData: false,
      barcodeData: false, pedigreeData: false, subscriptionData: false,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t('backup.title', 'Full System Backup')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Selection Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-base font-medium">{t('backup.selectData', 'Select Data to Backup')}</Label>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {getTotalSelectedRecords()} {t('backup.records', 'records')}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>None</Button>
                </div>
              </div>
            </div>
            
            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {backupCategories.map(({ key, label, icon: Icon, description, count }) => (
                <div key={key} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={key}
                    checked={selectedData[key as keyof BackupData]}
                    onCheckedChange={(checked) => handleDataSelectionChange(key as keyof BackupData, !!checked)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <Label htmlFor={key} className="font-medium text-sm cursor-pointer">{label}</Label>
                      </div>
                      <span className="text-xs bg-muted px-2 py-1 rounded flex-shrink-0">{count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {(isExporting || isImporting) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isExporting ? t('backup.export', 'Exporting') : t('backup.import', 'Importing')}...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* iCloud Browser (iOS only) */}
          {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Cloud className="w-4 h-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">iCloud Drive</p>
                  <p className="text-xs text-blue-700">{t('backup.messages.iCloudSync', 'Syncs automatically')}</p>
                </div>
              </div>
              <BackupFileBrowser onSelectBackup={handleNativeBackupSelected} />
            </div>
          )}

          {/* Export Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <Label className="text-base font-medium">{t('backup.export', 'Export Full Backup')}</Label>
              <p className="text-sm text-muted-foreground">{getTotalSelectedRecords()} records selected</p>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting || isImporting || !Object.values(selectedData).some(Boolean)}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'Exporting...' : t('backup.export', 'Export')}
            </Button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-base font-medium">{t('backup.import', 'Import Backup')}</Label>
              <p className="text-sm text-muted-foreground">
                {nativeBackupFileName || t('backup.messages.selectFileDesc', 'Select a backup file to restore')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
              <div className="flex-1 min-w-0">
                <Input type="file" accept=".json" onChange={handleFileChange} disabled={isImporting || isExporting} className="max-w-full" />
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || isExporting || (!importFile && !nativeBackupContent) || !Object.values(selectedData).some(Boolean)}
                className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
              >
                <Upload className={`w-4 h-4 ${isImporting ? 'animate-pulse' : ''}`} />
                {isImporting ? 'Importing...' : t('backup.import', 'Import')}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Importing will add new records. Duplicate IDs may cause errors. For best results, import to a clean database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemBackupManager;
