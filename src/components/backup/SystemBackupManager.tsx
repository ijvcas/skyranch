import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Database, Users, FileText, Calendar, Shield, MapPin, Heart, Clipboard, Bell, BarChart3, Cloud, DollarSign, Package, CheckSquare, UserCog, Home } from 'lucide-react';
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
  // NEW categories
  financialData: boolean;
  inventoryData: boolean;
  tasksData: boolean;
  userManagement: boolean;
  parcelOwners: boolean;
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
    // NEW categories default to true
    financialData: true,
    inventoryData: true,
    tasksData: true,
    userManagement: true,
    parcelOwners: true,
  });

  // Get data for export with actual counts
  const { data: users = [] } = useQuery({
    queryKey: ['backup-users'],
    queryFn: getAllUsers,
    enabled: selectedData.users,
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['backup-animals-optimized'],
    queryFn: async () => {
      console.log('🔄 Fetching optimized animals for backup...');
      const data = await getAllAnimalsForBackup(true);
      console.log(`📊 Fetched ${data.length} animals`);
      return data;
    },
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

  // NEW data queries
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

  const getFinancialCount = () => {
    if (!financialData) return 0;
    return (financialData.animalSales?.length || 0) + 
           (financialData.salePayments?.length || 0) + 
           (financialData.farmLedger?.length || 0) + 
           (financialData.expenseCategories?.length || 0) + 
           (financialData.financialBudgets?.length || 0);
  };

  const getInventoryCount = () => {
    if (!inventoryData) return 0;
    return (inventoryData.items?.length || 0) + 
           (inventoryData.transactions?.length || 0) + 
           (inventoryData.alerts?.length || 0);
  };

  const getTasksCount = () => {
    if (!tasksData) return 0;
    return tasksData.tasks?.length || 0;
  };

  const getUserManagementCount = () => {
    if (!userManagementData) return 0;
    return (userManagementData.userRoles?.length || 0) + 
           (userManagementData.profiles?.length || 0);
  };

  const backupCategories = [
    { 
      key: 'users', 
      label: t('backup.categories.users', 'Users'), 
      icon: Users, 
      description: t('backup.descriptions.users', 'App users and permissions'),
      count: users.length
    },
    { 
      key: 'animals', 
      label: t('backup.categories.animals', 'Animals'), 
      icon: Database, 
      description: t('backup.descriptions.animals', 'All animal records and data'),
      count: animals.length
    },
    { 
      key: 'fieldReports', 
      label: t('backup.categories.fieldReports', 'Field Reports'), 
      icon: Clipboard, 
      description: t('backup.descriptions.fieldReports', 'Daily field reports and entries'),
      count: fieldReports.length
    },
    { 
      key: 'lots', 
      label: t('backup.categories.lots', 'Lots'), 
      icon: MapPin, 
      description: t('backup.descriptions.lots', 'Lots, polygons, assignments'),
      count: lotsData ? (lotsData.lots?.length || 0) + (lotsData.polygons?.length || 0) : 0
    },
    { 
      key: 'cadastralData', 
      label: t('backup.categories.cadastralData', 'Cadastral Data'), 
      icon: Shield, 
      description: t('backup.descriptions.cadastralData', 'Parcels and properties'),
      count: cadastralData ? (cadastralData.parcels?.length || 0) + (cadastralData.properties?.length || 0) : 0
    },
    { 
      key: 'healthRecords', 
      label: t('backup.categories.healthRecords', 'Health Records'), 
      icon: Heart, 
      description: t('backup.descriptions.healthRecords', 'Vaccinations, treatments, checkups'),
      count: healthRecords.length
    },
    { 
      key: 'breedingRecords', 
      label: t('backup.categories.breedingRecords', 'Breeding Records'), 
      icon: FileText, 
      description: t('backup.descriptions.breedingRecords', 'Breeding and offspring data'),
      count: breedingData ? (breedingData.breedingRecords?.length || 0) + (breedingData.offspring?.length || 0) : 0
    },
    { 
      key: 'calendarEvents', 
      label: t('backup.categories.calendarEvents', 'Calendar Events'), 
      icon: Calendar, 
      description: t('backup.descriptions.calendarEvents', 'Scheduled events and reminders'),
      count: calendarData ? (calendarData.events?.length || 0) + (calendarData.eventNotifications?.length || 0) : 0
    },
    { 
      key: 'notifications', 
      label: t('backup.categories.notifications', 'Notifications'), 
      icon: Bell, 
      description: t('backup.descriptions.notifications', 'System notifications'),
      count: notifications.length
    },
    { 
      key: 'reports', 
      label: t('backup.categories.reports', 'Reports'), 
      icon: BarChart3, 
      description: t('backup.descriptions.reports', 'Saved reports'),
      count: reports.length
    },
    // NEW CATEGORIES
    { 
      key: 'financialData', 
      label: t('backup.categories.financialData', 'Financial Data'), 
      icon: DollarSign, 
      description: t('backup.descriptions.financialData', 'Sales, payments, ledger, budgets'),
      count: getFinancialCount()
    },
    { 
      key: 'inventoryData', 
      label: t('backup.categories.inventoryData', 'Inventory'), 
      icon: Package, 
      description: t('backup.descriptions.inventoryData', 'Items, transactions, alerts'),
      count: getInventoryCount()
    },
    { 
      key: 'tasksData', 
      label: t('backup.categories.tasksData', 'Tasks'), 
      icon: CheckSquare, 
      description: t('backup.descriptions.tasksData', 'Task management data'),
      count: getTasksCount()
    },
    { 
      key: 'userManagement', 
      label: t('backup.categories.userManagement', 'User Management'), 
      icon: UserCog, 
      description: t('backup.descriptions.userManagement', 'Roles and profiles'),
      count: getUserManagementCount()
    },
    { 
      key: 'parcelOwners', 
      label: t('backup.categories.parcelOwners', 'Property Ownership'), 
      icon: Home, 
      description: t('backup.descriptions.parcelOwners', 'Parcel ownership records'),
      count: parcelOwners.length
    },
  ];

  const handleDataSelectionChange = (category: keyof BackupData, checked: boolean) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: checked
    }));
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
          setTimeout(() => {
            callback();
            setProgress(100);
            setTimeout(() => setProgress(0), 2000);
          }, 500);
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
    if (selectedData.lots && lotsData) {
      total += (lotsData.lots?.length || 0) + (lotsData.polygons?.length || 0) + 
               (lotsData.assignments?.length || 0) + (lotsData.rotations?.length || 0);
    }
    if (selectedData.cadastralData && cadastralData) {
      total += (cadastralData.parcels?.length || 0) + (cadastralData.properties?.length || 0);
    }
    if (selectedData.healthRecords) total += healthRecords.length;
    if (selectedData.breedingRecords && breedingData) {
      total += (breedingData.breedingRecords?.length || 0) + (breedingData.offspring?.length || 0);
    }
    if (selectedData.calendarEvents && calendarData) {
      total += (calendarData.events?.length || 0) + (calendarData.eventNotifications?.length || 0);
    }
    if (selectedData.notifications) total += notifications.length;
    if (selectedData.reports) total += reports.length;
    // NEW categories
    if (selectedData.financialData) total += getFinancialCount();
    if (selectedData.inventoryData) total += getInventoryCount();
    if (selectedData.tasksData) total += getTasksCount();
    if (selectedData.userManagement) total += getUserManagementCount();
    if (selectedData.parcelOwners) total += parcelOwners.length;
    return total;
  };

  const handleExport = async () => {
    console.log('🚀 ========== EXPORT BUTTON CLICKED ==========');
    console.log('Selected data:', selectedData);
    console.log('Total records to export:', calculateTotalRecords());
    
    setIsExporting(true);
    
    simulateProgress(async () => {
      console.log('⏳ Starting backup data collection...');
      try {
        const totalRecords = calculateTotalRecords();
        const selectedCategories = Object.keys(selectedData).filter(key => selectedData[key as keyof BackupData]);
        
        const backupData: ComprehensiveBackupData = {
          metadata: {
            exportDate: new Date().toISOString(),
            version: '3.0.0',
            platform: 'ios',
            appVersion: '1.0.0',
            selectedCategories,
            totalRecords
          }
        };

        // Add selected data categories with actual data
        if (selectedData.users) {
          backupData.users = users;
          console.log(`📦 Users: ${users.length} records`);
        }
        if (selectedData.animals) {
          backupData.animals = animals;
          console.log(`📦 Animals: ${animals.length} records`);
        }
        if (selectedData.fieldReports) {
          backupData.fieldReports = fieldReports;
          console.log(`📦 Field Reports: ${fieldReports.length} records`);
        }
        if (selectedData.lots && lotsData) {
          backupData.lots = [lotsData];
          console.log(`📦 Lots data included`);
        }
        if (selectedData.cadastralData && cadastralData) {
          backupData.cadastralParcels = [cadastralData];
          console.log(`📦 Cadastral data included`);
        }
        if (selectedData.healthRecords) {
          backupData.healthRecords = healthRecords;
          console.log(`📦 Health: ${healthRecords.length} records`);
        }
        if (selectedData.breedingRecords && breedingData) {
          backupData.breedingRecords = [breedingData];
          console.log(`📦 Breeding data included`);
        }
        if (selectedData.calendarEvents && calendarData) {
          backupData.calendarEvents = [calendarData];
          console.log(`📦 Calendar data included`);
        }
        if (selectedData.notifications) {
          backupData.notifications = notifications;
          console.log(`📦 Notifications: ${notifications.length} records`);
        }
        if (selectedData.reports) {
          backupData.reports = reports;
          console.log(`📦 Reports: ${reports.length} records`);
        }
        // NEW data categories
        if (selectedData.financialData && financialData) {
          backupData.financialData = financialData;
          console.log(`📦 Financial: ${getFinancialCount()} records`);
        }
        if (selectedData.inventoryData && inventoryData) {
          backupData.inventoryData = inventoryData;
          console.log(`📦 Inventory: ${getInventoryCount()} records`);
        }
        if (selectedData.tasksData && tasksData) {
          backupData.tasksData = tasksData;
          console.log(`📦 Tasks: ${getTasksCount()} records`);
        }
        if (selectedData.userManagement && userManagementData) {
          backupData.userManagementData = userManagementData;
          console.log(`📦 User Management: ${getUserManagementCount()} records`);
        }
        if (selectedData.parcelOwners) {
          backupData.parcelOwners = parcelOwners;
          console.log(`📦 Parcel Owners: ${parcelOwners.length} records`);
        }

        const dataStr = JSON.stringify(backupData, null, 2);
        const backupSizeMB = (dataStr.length / 1024 / 1024).toFixed(2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const exportFileName = `farm_comprehensive_backup_${timestamp}_${totalRecords}records.json`;
        
        console.log('💾 Creating backup:', exportFileName);
        console.log(`📏 TOTAL BACKUP SIZE: ${backupSizeMB} MB`);

        // Check if running on native platform (iOS/Android)
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
          // Save to Documents directory for automatic iCloud backup on iOS
          await Filesystem.writeFile({
            path: exportFileName,
            data: dataStr,
            directory: Directory.Documents,
            encoding: Encoding.UTF8
          });

          console.log('✅ Backup saved to Documents directory:', exportFileName);

          toast({
            title: t('backup.messages.exportComplete'),
            description: `${t('backup.messages.backupSaved')}: ${exportFileName}`,
          });
        } else {
          // Web platform - download as file
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileName);
          document.body.appendChild(linkElement);
          linkElement.click();
          document.body.removeChild(linkElement);

          toast({
            title: t('backup.messages.exportComplete'),
            description: t('backup.messages.exportSuccess', { count: totalRecords, filename: exportFileName }),
          });
        }
      } catch (error) {
        console.error('Error during export:', error);
        toast({
          title: t('backup.messages.exportError', 'Export Error'),
          description: String(error),
          variant: "destructive"
        });
      } finally {
        setIsExporting(false);
      }
    });
  };

  const handleNativeBackupSelected = (content: string, fileName: string) => {
    setNativeBackupContent(content);
    setNativeBackupFileName(fileName);
    
    toast({
      title: t('backup.messages.fileSelected', 'File Selected'),
      description: fileName,
    });
  };

  const handleImport = () => {
    // Check if we have either a web file or native backup content
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative && !importFile) {
      toast({
        title: t('backup.messages.selectFileFirst'),
        description: t('backup.messages.selectFileDesc'),
        variant: "destructive",
      });
      return;
    }
    
    if (isNative && !nativeBackupContent && !importFile) {
      toast({
        title: t('backup.messages.selectFileFirst'),
        description: t('backup.messages.selectFileDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    simulateProgress(async () => {
      try {
        let text: string;
        
        // Get backup content from appropriate source
        if (isNative && nativeBackupContent) {
          text = nativeBackupContent;
        } else if (importFile) {
          text = await importFile.text();
        } else {
          throw new Error("No backup source available");
        }
        
        const backupData: ComprehensiveBackupData = JSON.parse(text);

        // Validate backup structure
        if (!backupData.metadata || !backupData.metadata.version) {
          throw new Error("Invalid backup file - missing metadata");
        }

        console.log('📦 Importing comprehensive backup data:', backupData.metadata);

        let totalImported = 0;

        // Import each data category based on selection
        if (backupData.fieldReports && selectedData.fieldReports) {
          const count = await importFieldReports(backupData.fieldReports);
          totalImported += count;
          console.log(`📋 Imported ${count} field reports`);
        }

        if (backupData.lots && selectedData.lots && Array.isArray(backupData.lots) && backupData.lots.length > 0) {
          const count = await importLots(backupData.lots[0]);
          totalImported += count;
          console.log(`🏞️ Imported ${count} lots and related data`);
        }

        if (backupData.cadastralParcels && selectedData.cadastralData && Array.isArray(backupData.cadastralParcels) && backupData.cadastralParcels.length > 0) {
          const count = await importCadastralData(backupData.cadastralParcels[0]);
          totalImported += count;
          console.log(`🗺️ Imported ${count} cadastral data records`);
        }

        if (backupData.healthRecords && selectedData.healthRecords) {
          const count = await importHealthRecords(backupData.healthRecords);
          totalImported += count;
          console.log(`❤️ Imported ${count} health records`);
        }

        if (backupData.breedingRecords && selectedData.breedingRecords && Array.isArray(backupData.breedingRecords) && backupData.breedingRecords.length > 0) {
          const count = await importBreedingData(backupData.breedingRecords[0]);
          totalImported += count;
          console.log(`🐄 Imported ${count} breeding records`);
        }

        if (backupData.calendarEvents && selectedData.calendarEvents && Array.isArray(backupData.calendarEvents) && backupData.calendarEvents.length > 0) {
          const count = await importCalendarData(backupData.calendarEvents[0]);
          totalImported += count;
          console.log(`📅 Imported ${count} calendar events`);
        }

        if (backupData.notifications && selectedData.notifications) {
          const count = await importNotifications(backupData.notifications);
          totalImported += count;
          console.log(`🔔 Imported ${count} notifications`);
        }

        if (backupData.reports && selectedData.reports) {
          const count = await importReports(backupData.reports);
          totalImported += count;
          console.log(`📊 Imported ${count} saved reports`);
        }

        // NEW data category imports
        if (backupData.financialData && selectedData.financialData) {
          const count = await importFinancialData(backupData.financialData);
          totalImported += count;
          console.log(`💰 Imported ${count} financial records`);
        }

        if (backupData.inventoryData && selectedData.inventoryData) {
          const count = await importInventoryData(backupData.inventoryData);
          totalImported += count;
          console.log(`📦 Imported ${count} inventory records`);
        }

        if (backupData.tasksData && selectedData.tasksData) {
          const count = await importTasksData(backupData.tasksData);
          totalImported += count;
          console.log(`✅ Imported ${count} tasks`);
        }

        if (backupData.userManagementData && selectedData.userManagement) {
          const count = await importUserManagementData(backupData.userManagementData);
          totalImported += count;
          console.log(`👤 Imported ${count} user management records`);
        }

        if (backupData.parcelOwners && selectedData.parcelOwners) {
          const count = await importParcelOwners(backupData.parcelOwners);
          totalImported += count;
          console.log(`🏠 Imported ${count} parcel owners`);
        }

        toast({
          title: t('backup.messages.importComplete'),
          description: t('backup.messages.importSuccess', { count: totalImported }),
        });

      } catch (error: any) {
        console.error("Error importing comprehensive backup:", error);
        toast({
          title: t('backup.messages.importError', 'Import Error'),
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
        setImportFile(null);
        setNativeBackupContent(null);
        setNativeBackupFileName(null);
      }
    });
  };

  const getTotalSelectedRecords = (): number => {
    return backupCategories
      .filter(category => selectedData[category.key as keyof BackupData])
      .reduce((total, category) => total + category.count, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t('backup.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-base font-medium">{t('backup.selectData')}</Label>
              <div className="text-sm text-muted-foreground">
                {t('backup.totalRecords', { count: getTotalSelectedRecords() })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
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
                        <Label htmlFor={key} className="font-medium text-sm sm:text-base">{label}</Label>
                      </div>
                      <span className="text-xs bg-muted px-2 py-1 rounded flex-shrink-0">
                        {count}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {(isExporting || isImporting) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isExporting ? t('backup.export') : t('backup.import')}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* iCloud Backup Browser (iOS only) */}
          {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Cloud className="w-4 h-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">iCloud Drive</p>
                  <p className="text-xs text-blue-700">{t('backup.messages.iCloudSync')}</p>
                </div>
              </div>
              <BackupFileBrowser onSelectBackup={handleNativeBackupSelected} />
            </div>
          )}

          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium">{t('backup.export')}</Label>
                <p className="text-sm text-muted-foreground">{t('backup.selectData')}</p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting || isImporting || !Object.values(selectedData).some(Boolean)}
                className="flex items-center gap-2 w-full md:w-auto flex-shrink-0"
              >
                {isExporting ? (
                  <>
                    <Download className="w-4 h-4 animate-pulse" />
                    {t('backup.export')}...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t('backup.export')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">{t('backup.import')}</Label>
              <p className="text-sm text-muted-foreground">
                {Capacitor.isNativePlatform()
                  ? nativeBackupFileName 
                    ? `${nativeBackupFileName}` 
                    : t('backup.messages.selectFileDesc')
                  : t('backup.messages.selectFileDesc')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
              <div className="flex-1 min-w-0">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={isImporting || isExporting}
                  className="max-w-full"
                />
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || isExporting || (!importFile && !nativeBackupContent) || !Object.values(selectedData).some(Boolean)}
                className="flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
              >
                {isImporting ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    {t('backup.import')}...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t('backup.import')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{t('backup.messages.selectFileFirst')}:</strong> {t('backup.messages.selectFileDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemBackupManager;
