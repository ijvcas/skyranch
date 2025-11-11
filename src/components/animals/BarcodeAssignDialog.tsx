import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QrCode, Loader2 } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { BarcodeService } from '@/services/barcodeService';

interface BarcodeAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  animalName: string;
  currentBarcode?: string;
  onSuccess?: () => void;
}

export function BarcodeAssignDialog({
  open,
  onOpenChange,
  animalId,
  animalName,
  currentBarcode,
  onSuccess,
}: BarcodeAssignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState(currentBarcode || '');
  const { scanBarcode, isScanning } = useBarcodeScanner();

  const handleScan = async () => {
    const result = await scanBarcode();
    if (result) {
      setBarcode(result.details?.barcode || '');
    }
  };

  const handleAssign = async () => {
    if (!barcode.trim()) {
      toast.error('Please enter or scan a barcode');
      return;
    }

    setLoading(true);
    try {
      // Check if barcode already exists
      const existing = await BarcodeService.lookupBarcode(barcode);
      if (existing && 'type' in existing && existing.id !== animalId) {
        toast.error('This barcode is already assigned to another item');
        return;
      }

      // Update animal with barcode
      const { error: updateError } = await supabase
        .from('animals')
        .update({ barcode })
        .eq('id', animalId);

      if (updateError) throw updateError;

      // Register in barcode registry if not exists
      await BarcodeService.registerBarcode(barcode, 'animal', animalId, `Assigned to ${animalName}`);

      toast.success('Barcode assigned successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign barcode:', error);
      toast.error('Failed to assign barcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Barcode to {animalName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode Number</Label>
            <div className="flex gap-2">
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter or scan barcode"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAssign}
              disabled={loading || !barcode.trim()}
              className="flex-1"
            >
              {loading ? 'Assigning...' : 'Assign Barcode'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
