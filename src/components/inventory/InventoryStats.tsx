import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Package, AlertCircle, Grid3x3 } from 'lucide-react';

interface InventoryStatsProps {
  totalItems: number;
  lowStockCount: number;
  categories: number;
}

export function InventoryStats({ totalItems, lowStockCount, categories }: InventoryStatsProps) {
  const { t } = useTranslation('inventory');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">{t('totalItems')}</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">{t('lowStock')}</p>
            <p className="text-2xl font-bold">{lowStockCount}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">{t('categories')}</p>
            <p className="text-2xl font-bold">{categories}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}