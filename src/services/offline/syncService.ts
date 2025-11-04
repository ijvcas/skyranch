import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from './offlineStorage';
import { toast } from 'sonner';

class SyncService {
  private isSyncing = false;
  private isPaused = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  pauseSync(): void {
    this.isPaused = true;
    console.log('⏸️ Sync paused');
  }

  resumeSync(): void {
    this.isPaused = false;
    console.log('▶️ Sync resumed');
    // Auto-sync pending operations when resumed
    this.syncPendingOperations();
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⏸️ Sync already in progress');
      return { success: false, synced: 0, failed: 0, message: 'Sync in progress' };
    }

    if (this.isPaused) {
      console.log('⏸️ Sync is paused');
      return { success: false, synced: 0, failed: 0, message: 'Sync is paused' };
    }

    this.isSyncing = true;
    this.notifyListeners({ syncing: true, progress: 0 });

    const operations = await offlineStorage.getPendingSyncOperations();
    console.log(`🔄 Syncing ${operations.length} pending operations`);

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      this.notifyListeners({ 
        syncing: true, 
        progress: ((i + 1) / operations.length) * 100 
      });

      try {
        await this.syncOperation(op);
        await offlineStorage.removePendingSync(op.id);
        synced++;
      } catch (error) {
        console.error('❌ Failed to sync operation:', op.id, error);
        failed++;
      }
    }

    this.isSyncing = false;
    this.notifyListeners({ syncing: false, progress: 100 });

    const result = {
      success: failed === 0,
      synced,
      failed,
      message: `Sincronizado: ${synced}, Fallidos: ${failed}`,
    };

    if (synced > 0) {
      toast.success(`✅ ${synced} cambios sincronizados`);
    }
    if (failed > 0) {
      toast.error(`❌ ${failed} cambios fallidos`);
    }

    console.log('✅ Sync complete:', result);
    return result;
  }

  private async syncOperation(operation: any): Promise<void> {
    const { table, type, data } = operation;

    switch (type) {
      case 'create':
        const { error: insertError } = await supabase.from(table).insert(data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  async getPendingCount(): Promise<number> {
    const operations = await offlineStorage.getPendingSyncOperations();
    return operations.length;
  }

  subscribe(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(status: SyncStatus): void {
    this.syncListeners.forEach(listener => listener(status));
  }

  // Auto-sync when connection restored
  setupAutoSync(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored, starting auto-sync');
      setTimeout(() => this.syncPendingOperations(), 1000);
    });
  }
}

export interface SyncStatus {
  syncing: boolean;
  progress: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  message: string;
}

export const syncService = new SyncService();
