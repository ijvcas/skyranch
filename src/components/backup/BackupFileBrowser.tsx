import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Trash2, Download, Cloud, RefreshCw } from 'lucide-react';
import { iCloudBackupService, BackupFileInfo } from '@/services/native/iCloudBackupService';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BackupFileBrowserProps {
  onSelectBackup: (content: string, fileName: string) => void;
}

const BackupFileBrowser: React.FC<BackupFileBrowserProps> = ({ onSelectBackup }) => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const files = await iCloudBackupService.listBackups();
      setBackups(files);
      
      if (files.length === 0) {
        toast({
          title: "No hay backups",
          description: "No se encontraron backups en iCloud Drive. Crea uno primero usando el botón de exportar.",
        });
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los backups desde iCloud",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (iCloudBackupService.isIOS()) {
      loadBackups();
    }
  }, []);

  const handleRestoreBackup = async (backup: BackupFileInfo) => {
    try {
      toast({
        title: "Cargando backup...",
        description: `Leyendo ${backup.name} desde iCloud`,
      });

      const content = await iCloudBackupService.readBackup(backup.name);
      onSelectBackup(content, backup.name);

      toast({
        title: "Backup cargado",
        description: `Listo para restaurar ${backup.recordCount} registros`,
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el backup",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBackup = async () => {
    if (!deleteTarget) return;

    try {
      await iCloudBackupService.deleteBackup(deleteTarget);
      
      toast({
        title: "Backup eliminado",
        description: "El archivo ha sido eliminado de iCloud Drive",
      });

      // Reload the list
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el backup",
        variant: "destructive"
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!iCloudBackupService.isIOS()) {
    return null; // Only show on iOS
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Backups en iCloud Drive
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBackups}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <Alert>
              <Cloud className="w-4 h-4" />
              <AlertDescription>
                No hay backups disponibles en iCloud Drive. Los backups exportados se sincronizarán automáticamente si iCloud Drive está habilitado en tu dispositivo.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate mb-2">{backup.name}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Fecha:</span>
                          <span>{backup.formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Tamaño:</span>
                          <span>{iCloudBackupService.formatFileSize(backup.size)}</span>
                        </div>
                        {backup.recordCount > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Registros:</span>
                            <span>{backup.recordCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRestoreBackup(backup)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(backup.name)}
                      className="sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-0 mr-1" />
                      <span className="sm:hidden">Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el archivo de backup de iCloud Drive. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupFileBrowser;
