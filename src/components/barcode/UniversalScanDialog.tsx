import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Tag, ExternalLink } from 'lucide-react';
import type { UniversalProduct } from '@/services/productLookupService';
import type { BarcodeEntity } from '@/services/barcodeService';

interface UniversalScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BarcodeEntity | UniversalProduct | null;
  barcode: string;
  onAddToInventory?: (product: UniversalProduct) => void;
  onViewDetails?: (entity: BarcodeEntity) => void;
  onCreateManual?: (barcode: string) => void;
}

export function UniversalScanDialog({
  open,
  onOpenChange,
  result,
  barcode,
  onAddToInventory,
  onViewDetails,
  onCreateManual,
}: UniversalScanDialogProps) {
  const isUniversalProduct = result && 'source' in result;
  const isFarmEntity = result && 'type' in result;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUniversalProduct && <Package className="h-5 w-5" />}
            {isFarmEntity && <Tag className="h-5 w-5" />}
            {!result && <ShoppingCart className="h-5 w-5" />}
            Barcode Scan Result
          </DialogTitle>
          <DialogDescription>
            Barcode: <span className="font-mono font-semibold">{barcode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isUniversalProduct && (
            <UniversalProductCard 
              product={result as UniversalProduct}
              onAddToInventory={onAddToInventory}
            />
          )}

          {isFarmEntity && (
            <FarmEntityCard 
              entity={result as BarcodeEntity}
              onViewDetails={onViewDetails}
            />
          )}

          {!result && (
            <NotFoundCard 
              barcode={barcode}
              onCreateManual={onCreateManual}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UniversalProductCard({ 
  product, 
  onAddToInventory 
}: { 
  product: UniversalProduct; 
  onAddToInventory?: (product: UniversalProduct) => void;
}) {
  return (
    <div className="space-y-4">
      {product.image_url && (
        <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.product_name}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{product.product_name}</h3>
        {product.brand && (
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        )}
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Source: {product.source === 'openfoodfacts' ? 'Open Food Facts' : 'UPCitemdb'}
        </p>
      </div>

      <div className="flex gap-2">
        {onAddToInventory && (
          <Button 
            onClick={() => onAddToInventory(product)}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Inventory
          </Button>
        )}
        {product.source_url && (
          <Button 
            variant="outline" 
            onClick={() => window.open(product.source_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function FarmEntityCard({ 
  entity, 
  onViewDetails 
}: { 
  entity: BarcodeEntity; 
  onViewDetails?: (entity: BarcodeEntity) => void;
}) {
  const getEntityIcon = () => {
    switch (entity.type) {
      case 'animal': return '🐄';
      case 'inventory': return '📦';
      case 'lot': return '🏞️';
      case 'equipment': return '🔧';
      default: return '📌';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-2">{getEntityIcon()}</div>
        <h3 className="font-semibold text-lg">{entity.name}</h3>
        <p className="text-sm text-muted-foreground capitalize">{entity.type}</p>
      </div>

      {onViewDetails && (
        <Button 
          onClick={() => onViewDetails(entity)}
          className="w-full"
        >
          View Details
        </Button>
      )}
    </div>
  );
}

function NotFoundCard({ 
  barcode, 
  onCreateManual 
}: { 
  barcode: string; 
  onCreateManual?: (barcode: string) => void;
}) {
  return (
    <div className="space-y-4 text-center py-6">
      <div className="text-muted-foreground">
        <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Product not found in farm database or internet</p>
      </div>

      {onCreateManual && (
        <Button 
          onClick={() => onCreateManual(barcode)}
          variant="outline"
          className="w-full"
        >
          Create Manual Entry
        </Button>
      )}
    </div>
  );
}
