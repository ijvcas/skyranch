import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncService, SyncStatus } from '@/services/offline/syncService';
import { cn } from '@/lib/utils';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, progress: 0 });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update pending count periodically
    const updatePendingCount = async () => {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    // Subscribe to sync status
    const unsubscribe = syncService.subscribe(setSyncStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    await syncService.syncPendingOperations();
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50',
        'bg-background border rounded-lg shadow-lg p-3'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">En línea</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">Sin conexión</span>
            </>
          )}
        </div>

        {pendingCount > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {isOnline && !syncStatus.syncing && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                className="ml-2"
              >
                <CloudUpload className="w-4 h-4 mr-1" />
                Sincronizar
              </Button>
            )}

            {syncStatus.syncing && (
              <div className="ml-2 text-sm text-muted-foreground">
                Sincronizando... {Math.round(syncStatus.progress)}%
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
