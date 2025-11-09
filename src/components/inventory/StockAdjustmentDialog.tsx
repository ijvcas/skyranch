import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem, TransactionType } from '@/stores/inventoryStore';

interface StockAdjustmentDialogProps {
  item: InventoryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAdjustmentDialog({ item, open, onOpenChange }: StockAdjustmentDialogProps) {
  const { createTransaction } = useInventory();
  const [formData, setFormData] = useState({
    transaction_type: 'usage' as TransactionType,
    quantity: 0,
    unit_cost: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction({
        item_id: item.id,
        ...formData,
        total_cost: formData.transaction_type === 'purchase' ? formData.unit_cost * formData.quantity : undefined
      });
      onOpenChange(false);
      setFormData({
        transaction_type: 'usage',
        quantity: 0,
        unit_cost: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={formData.transaction_type}
              onValueChange={(value) => setFormData({ ...formData, transaction_type: value as TransactionType })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase (Add)</SelectItem>
                <SelectItem value="usage">Usage (Remove)</SelectItem>
                <SelectItem value="waste">Waste (Remove)</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity ({item.unit})</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              min="0"
              step="0.01"
              required
            />
          </div>

          {formData.transaction_type === 'purchase' && (
            <div>
              <Label htmlFor="cost">Unit Cost</Label>
              <Input
                id="cost"
                type="number"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Record Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
