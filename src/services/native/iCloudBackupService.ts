import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface BackupFileInfo {
  name: string;
  path: string;
  size: number;
  modifiedTime: number;
  formattedDate: string;
  recordCount: number;
}

export const iCloudBackupService = {
  /**
   * Check if we're running on native iOS
   */
  isIOS: (): boolean => {
    return Capacitor.getPlatform() === 'ios';
  },

  /**
   * List all backup files from Documents directory (synced with iCloud)
   */
  listBackups: async (): Promise<BackupFileInfo[]> => {
    try {
      const result = await Filesystem.readdir({
        path: '',
        directory: Directory.Documents
      });

      // Filter for backup JSON files
      const backupFiles = result.files.filter(file => 
        file.name.startsWith('farm_comprehensive_backup_') && 
        file.name.endsWith('.json')
      );

      // Get file info for each backup
      const fileInfoPromises = backupFiles.map(async (file) => {
        try {
          const stat = await Filesystem.stat({
            path: file.name,
            directory: Directory.Documents
          });

          // Extract record count from filename if available
          const recordMatch = file.name.match(/(\d+)records\.json$/);
          const recordCount = recordMatch ? parseInt(recordMatch[1]) : 0;

          // Format date nicely
          const date = new Date(stat.mtime);
          const formattedDate = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return {
            name: file.name,
            path: file.uri || file.name,
            size: stat.size,
            modifiedTime: stat.mtime,
            formattedDate,
            recordCount
          };
        } catch (error) {
          console.error(`Error getting stats for ${file.name}:`, error);
          return null;
        }
      });

      const fileInfos = await Promise.all(fileInfoPromises);
      
      // Filter out nulls and sort by date (newest first)
      return fileInfos
        .filter((info): info is BackupFileInfo => info !== null)
        .sort((a, b) => b.modifiedTime - a.modifiedTime);

    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  },

  /**
   * Read backup file content from Documents directory
   */
  readBackup: async (fileName: string): Promise<string> => {
    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      return result.data as string;
    } catch (error) {
      console.error('Error reading backup file:', error);
      throw new Error(`No se pudo leer el archivo: ${fileName}`);
    }
  },

  /**
   * Delete a backup file
   */
  deleteBackup: async (fileName: string): Promise<void> => {
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Documents
      });
    } catch (error) {
      console.error('Error deleting backup file:', error);
      throw new Error(`No se pudo eliminar el archivo: ${fileName}`);
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
};
