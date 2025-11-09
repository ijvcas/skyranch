import { useState } from 'react';
import { Plus, Package, AlertTriangle, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/hooks/useInventory';
import { InventoryCard } from '@/components/inventory/InventoryCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { LowStockAlerts } from '@/components/inventory/LowStockAlerts';
import { BarcodeScannerService } from '@/services/barcode/barcodeService';
import { toast } from 'sonner';

export default function Inventory() {
  const { items, isLoading } = useInventory();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const lowStockItems = items.filter(i => i.current_quantity <= i.min_quantity);

  const handleScan = async () => {
    try {
      const barcode = await BarcodeScannerService.scan();
      if (barcode) {
        const item = items.find(i => i.barcode === barcode);
        if (item) {
          toast.success(`Found: ${item.name}`);
          // You could open a detail dialog here
        } else {
          toast.info('No item found with this barcode. Add it?');
          setAddItemOpen(true);
        }
      }
    } catch (error) {
      toast.error('Failed to scan barcode');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track your feed, medicine, and supplies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScan}>
            <Scan className="mr-2 h-4 w-4" />
            Scan
          </Button>
          <Button onClick={() => setAddItemOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <LowStockAlerts items={lowStockItems} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Total Items</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Low Stock</h3>
          </div>
          <p className="text-3xl font-bold text-destructive">{lowStockItems.length}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Categories</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{new Set(items.map(i => i.category)).size}</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="medicine">Medicine</TabsTrigger>
          <TabsTrigger value="supplement">Supplements</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Loading inventory...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No items in this category. Add your first item!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(item => (
                <InventoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />
    </div>
  );
}
