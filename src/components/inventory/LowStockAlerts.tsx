import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from '@/stores/inventoryStore';

interface LowStockAlertsProps {
  items: InventoryItem[];
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
  if (items.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Low Stock Alert</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The following items are running low:</p>
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <Badge key={item.id} variant="outline" className="bg-background">
              {item.name} ({item.current_quantity} {item.unit})
            </Badge>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
