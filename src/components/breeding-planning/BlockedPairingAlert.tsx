import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';

interface BlockedPairingAlertProps {
  maleName: string;
  femaleName: string;
  reason: string;
  onDismiss?: () => void;
}

export const BlockedPairingAlert: React.FC<BlockedPairingAlertProps> = ({
  maleName,
  femaleName,
  reason,
  onDismiss
}) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Apareamiento Bloqueado
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 p-1 hover:bg-destructive/20 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          <p className="font-medium">
            🚫 {maleName} × {femaleName}
          </p>
          <p className="text-sm mt-1">
            {reason}
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Este apareamiento ha sido automáticamente bloqueado para prevenir consanguinidad.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};