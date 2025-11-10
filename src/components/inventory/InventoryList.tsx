import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import { InventoryItem } from '@/hooks/useInventory';

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export function InventoryList({ items, isLoading, onEdit, onDelete }: InventoryListProps) {
  const { t } = useTranslation('inventory');

  const isLowStock = (item: InventoryItem) => {
    return item.min_quantity && item.current_quantity < item.min_quantity;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No inventory items yet
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <Badge variant="outline">{t(`category.${item.category}`)}</Badge>
            </div>
            {isLowStock(item) && (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('fields.currentQuantity')}:</span>
              <span className="font-medium">
                {item.current_quantity} {item.unit}
              </span>
            </div>
            {item.min_quantity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.minQuantity')}:</span>
                <span>{item.min_quantity} {item.unit}</span>
              </div>
            )}
            {item.storage_location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('fields.storageLocation')}:</span>
                <span>{item.storage_location}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="ghost" onClick={() => onEdit(item.id)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}