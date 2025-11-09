import { Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InventoryItem } from '@/stores/inventoryStore';
import { useState } from 'react';
import { StockAdjustmentDialog } from './StockAdjustmentDialog';

interface InventoryCardProps {
  item: InventoryItem;
}

export function InventoryCard({ item }: InventoryCardProps) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  
  const stockPercentage = item.max_quantity 
    ? (item.current_quantity / item.max_quantity) * 100 
    : 0;
  
  const isLowStock = item.current_quantity <= item.min_quantity;
  const isExpiringSoon = item.expiry_date && 
    new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const categoryColors = {
    feed: 'bg-green-500/10 text-green-500',
    medicine: 'bg-red-500/10 text-red-500',
    supplement: 'bg-blue-500/10 text-blue-500',
    equipment: 'bg-purple-500/10 text-purple-500',
    other: 'bg-gray-500/10 text-gray-500'
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
              <Badge className={categoryColors[item.category]}>
                {item.category}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Stock Level</span>
              <span className="font-semibold text-foreground">
                {item.current_quantity} {item.unit}
              </span>
            </div>
            {item.max_quantity && (
              <Progress value={stockPercentage} className="h-2" />
            )}
          </div>

          {isLowStock && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Low stock alert!</span>
            </div>
          )}

          {isExpiringSoon && (
            <div className="flex items-center gap-2 text-sm text-orange-500">
              <TrendingDown className="h-4 w-4" />
              <span>Expiring soon</span>
            </div>
          )}

          {item.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
          )}

          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={() => setAdjustOpen(true)}
          >
            Adjust Stock
          </Button>
        </div>
      </Card>

      <StockAdjustmentDialog 
        item={item} 
        open={adjustOpen} 
        onOpenChange={setAdjustOpen} 
      />
    </>
  );
}
