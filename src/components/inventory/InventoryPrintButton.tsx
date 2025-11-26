import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { printService, type PrintInventoryData } from '@/services/printService';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useInventory';

export function InventoryPrintButton() {
  const { toast } = useToast();
  const { items } = useInventory();

  const handlePrint = async () => {
    try {
      const printData: PrintInventoryData = {
        items: items.map(item => ({
          name: item.name,
          category: item.category,
          current_quantity: item.current_quantity,
          unit: item.unit,
          min_quantity: item.min_quantity,
          expiry_date: item.expiry_date,
          supplier: item.supplier,
          storage_location: item.storage_location,
        })),
        title: 'Inventory Report',
        date: new Date().toLocaleDateString(),
      };

      await printService.printInventoryReport(printData);
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Failed to generate print preview. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handlePrint} 
      variant="outline" 
      size="icon"
      aria-label="Print Report"
      title="Print Report"
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
}
