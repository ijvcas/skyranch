import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Database, Users, FileText, Calendar, Shield, MapPin, Heart, Clipboard, Bell, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { iCloudBackupService } from '@/services/native/iCloudBackupService';
import BackupFileBrowser from './BackupFileBrowser';
import { getAllUsers } from '@/services/userService';
import { getAllAnimals } from '@/services/animalService';
import { getAllFieldReports, importFieldReports } from '@/services/fieldReportBackupService';
import { 
  getAllLots, 
  getAllCadastralData, 
  getAllHealthRecords, 
  getAllBreedingData, 
  getAllCalendarData, 
  getAllNotifications, 
  getAllReports,
  importLots,
  importCadastralData,
  importHealthRecords,
  importBreedingData,
  importCalendarData,
  importNotifications,
  importReports,
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
}

const SystemBackupManager: React.FC = () => {
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
  });

  // Get data for export with actual counts
  const { data: users = [] } = useQuery({
    queryKey: ['backup-users'],
    queryFn: getAllUsers,
    enabled: selectedData.users,
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['backup-animals'],
    queryFn: () => getAllAnimals(true),
    enabled: selectedData.animals,
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

  const backupCategories = [
    { 
      key: 'users', 
      label: 'Usuarios', 
      icon: Users, 
      description: 'Cuentas de usuario y configuraciones',
      count: users.length
    },
    { 
      key: 'animals', 
      label: 'Animales', 
      icon: Database, 
      description: 'Registro de animales y genealogía',
      count: animals.length
    },
    { 
      key: 'fieldReports', 
      label: 'Reportes de Campo', 
      icon: Clipboard, 
      description: 'Reportes de campo y observaciones',
      count: fieldReports.length
    },
    { 
      key: 'lots', 
      label: 'Lotes y Terrenos', 
      icon: MapPin, 
      description: 'Lotes, polígonos y asignaciones de animales',
      count: lotsData ? (lotsData.lots?.length || 0) + (lotsData.polygons?.length || 0) : 0
    },
    { 
      key: 'cadastralData', 
      label: 'Datos Catastrales', 
      icon: Shield, 
      description: 'Parcelas catastrales y propiedades',
      count: cadastralData ? (cadastralData.parcels?.length || 0) + (cadastralData.properties?.length || 0) : 0
    },
    { 
      key: 'healthRecords', 
      label: 'Registros de Salud', 
      icon: Heart, 
      description: 'Historial médico y tratamientos',
      count: healthRecords.length
    },
    { 
      key: 'breedingRecords', 
      label: 'Registros de Reproducción', 
      icon: FileText, 
      description: 'Apareamientos, crías y descendencia',
      count: breedingData ? (breedingData.breedingRecords?.length || 0) + (breedingData.offspring?.length || 0) : 0
    },
    { 
      key: 'calendarEvents', 
      label: 'Eventos del Calendario', 
      icon: Calendar, 
      description: 'Eventos programados y recordatorios',
      count: calendarData ? (calendarData.events?.length || 0) + (calendarData.eventNotifications?.length || 0) : 0
    },
    { 
      key: 'notifications', 
      label: 'Notificaciones', 
      icon: Bell, 
      description: 'Historial de notificaciones del sistema',
      count: notifications.length
    },
    { 
      key: 'reports', 
      label: 'Reportes Guardados', 
      icon: BarChart3, 
      description: 'Reportes personalizados guardados',
      count: reports.length
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
    return total;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    simulateProgress(async () => {
      try {
        const totalRecords = calculateTotalRecords();
        const selectedCategories = Object.keys(selectedData).filter(key => selectedData[key as keyof BackupData]);
        
        const backupData: ComprehensiveBackupData = {
          metadata: {
            exportDate: new Date().toISOString(),
            version: '2.0.0',
            platform: 'ios',
            appVersion: '1.0.0',
            selectedCategories,
            totalRecords
          }
        };

        // Add selected data categories with actual data
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

        const dataStr = JSON.stringify(backupData, null, 2);
        const timestamp = new Date().toISOString().split('T')[0];
        const exportFileName = `farm_comprehensive_backup_${timestamp}_${totalRecords}records.json`;

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

          toast({
            title: "Backup Completado",
            description: `Backup guardado en documentos: ${totalRecords} registros. ${Capacitor.getPlatform() === 'ios' ? 'Se sincronizará automáticamente con iCloud si está habilitado.' : ''}`,
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
            title: "Backup Completado",
            description: `Backup exportado exitosamente: ${totalRecords} registros en ${exportFileName}`,
          });
        }
      } catch (error) {
        console.error('Error during export:', error);
        toast({
          title: "Error en Backup",
          description: "No se pudo completar el backup",
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
      title: "Backup seleccionado",
      description: `${fileName} listo para restaurar`,
    });
  };

  const handleImport = () => {
    // Check if we have either a web file or native backup content
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative && !importFile) {
      toast({
        title: "Archivo No Seleccionado",
        description: "Por favor selecciona un archivo de backup para importar.",
        variant: "destructive",
      });
      return;
    }
    
    if (isNative && !nativeBackupContent && !importFile) {
      toast({
        title: "Backup No Seleccionado",
        description: "Por favor selecciona un backup de iCloud Drive o un archivo local para restaurar.",
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
          throw new Error("Archivo de backup inválido - falta metadata");
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

        toast({
          title: "Importación Completada",
          description: `Se han importado ${totalImported} registros exitosamente de todas las categorías seleccionadas.`,
        });

      } catch (error: any) {
        console.error("Error importing comprehensive backup:", error);
        toast({
          title: "Error en Importación",
          description: `Error al importar: ${error.message}`,
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
            Sistema de Backup Integral y Restauración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-base font-medium">Seleccionar Datos para Backup/Restauración</Label>
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold">{getTotalSelectedRecords()}</span> registros
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
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                        {count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {(isExporting || isImporting) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isExporting ? 'Exportando datos completos...' : 'Importando y restaurando datos...'}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* iCloud Backup Browser (iOS only) */}
          {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && (
            <BackupFileBrowser onSelectBackup={handleNativeBackupSelected} />
          )}

          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Label className="text-base font-medium">Exportar Datos Completos</Label>
                <p className="text-sm text-gray-500">Crear un backup integral de todas las categorías seleccionadas</p>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting || isImporting || !Object.values(selectedData).some(Boolean)}
                className="flex items-center gap-2 w-full md:w-auto flex-shrink-0"
              >
                {isExporting ? (
                  <>
                    <Download className="w-4 h-4 animate-pulse" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar Backup Integral
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">
                {Capacitor.isNativePlatform() 
                  ? 'Restaurar desde Archivo Local' 
                  : 'Restaurar Sistema Completo'}
              </Label>
              <p className="text-sm text-gray-500">
                {Capacitor.isNativePlatform()
                  ? nativeBackupFileName 
                    ? `Archivo iCloud seleccionado: ${nativeBackupFileName}` 
                    : 'Selecciona un archivo local para restaurar (o usa un backup de iCloud arriba)'
                  : 'Restaurar completamente el sistema desde un archivo de backup integral'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={isImporting || isExporting}
                />
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || isExporting || (!importFile && !nativeBackupContent) || !Object.values(selectedData).some(Boolean)}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Restaurar Sistema
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Advertencia:</strong> Este sistema de backup integral permite la restauración completa 
              de todos los datos del sistema, incluyendo reportes de campo, lotes, datos catastrales, y toda 
              la información operacional. La importación puede sobrescribir información existente. 
              Se recomienda crear un backup actual antes de restaurar datos externos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemBackupManager;
