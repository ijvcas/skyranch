import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/hooks/useInventory';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { ScanLine, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InventoryItemDialog from '@/components/inventory/InventoryItemDialog';
import { UniversalScanDialog } from '@/components/barcode/UniversalScanDialog';
import { AddToInventoryDialog } from '@/components/barcode/AddToInventoryDialog';
import { BarcodeService, BarcodeLookupResult } from '@/services/barcodeService';
import type { UniversalProduct } from '@/services/productLookupService';
import { useNavigate } from 'react-router-dom';

export default function Inventory() {
  const { t } = useTranslation('inventory');
  const { items, isLoading } = useInventory();
  const { scanBarcode, isScanning } = useBarcodeScanner();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanResult, setScanResult] = useState<BarcodeLookupResult>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [addToInventoryOpen, setAddToInventoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UniversalProduct | null>(null);

  const lowStockItems = items.filter(
    item => item.min_quantity && item.current_quantity < item.min_quantity
  );

  const handleScan = async () => {
    const result = await scanBarcode();
    if (result) {
      // We have a barcode result, show the universal scan dialog
      setScannedBarcode(result.id || '');
      setScanResult(result);
      setScanDialogOpen(true);
    }
  };

  const handleAddToInventory = (product: UniversalProduct) => {
    setSelectedProduct(product);
    setScanDialogOpen(false);
    setAddToInventoryOpen(true);
  };

  const handleViewDetails = (entity: { id: string; type: string; name: string }) => {
    setScanDialogOpen(false);
    // Navigate to the entity detail page
    if (entity.type === 'inventory') {
      toast({ title: 'Viewing inventory item', description: entity.name });
    } else if (entity.type === 'animal') {
      navigate(`/animals/${entity.id}`);
    }
  };

  const handleCreateManual = () => {
    setScanDialogOpen(false);
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <Card className="p-8 text-center">Loading inventory...</Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      
      <div className="flex gap-2">
        <Button variant="gradient" onClick={handleScan} disabled={isScanning}>
          <ScanLine className="mr-2 h-4 w-4" />
          {isScanning ? 'Scanning...' : t('scan')}
        </Button>
        <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addItem')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
          <p className="text-3xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Low Stock</h3>
          <p className="text-3xl font-bold text-orange-500">{lowStockItems.length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
          <p className="text-3xl font-bold">{[...new Set(items.map(i => i.category))].length}</p>
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Management System</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
              {item.barcode && (
                <p className="text-xs text-muted-foreground mt-1">
                  <ScanLine className="inline h-3 w-3 mr-1" />
                  {item.barcode}
                </p>
              )}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Current:</span>
                  <span className="font-medium">{item.current_quantity} {item.unit}</span>
                </div>
                {item.min_quantity && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Min:</span>
                    <span>{item.min_quantity} {item.unit}</span>
                  </div>
                )}
              </div>
              {lowStockItems.some(i => i.id === item.id) && (
                <div className="mt-2 text-xs text-orange-500 font-medium">⚠ Low Stock</div>
              )}
            </Card>
          ))}
          
          {items.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No inventory items yet. Database is ready!
            </div>
          )}
        </div>
      </Card>
      
      <InventoryItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      
      <UniversalScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        result={scanResult}
        barcode={scannedBarcode}
        onAddToInventory={handleAddToInventory}
        onViewDetails={handleViewDetails}
        onCreateManual={handleCreateManual}
      />
      
      {selectedProduct && (
        <AddToInventoryDialog
          open={addToInventoryOpen}
          onOpenChange={setAddToInventoryOpen}
          product={selectedProduct}
          onSuccess={() => {
            setAddToInventoryOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
