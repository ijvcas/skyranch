import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/hooks/useInventory';
import { InventoryCategory } from '@/stores/inventoryStore';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const { createItem, isCreating } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    category: 'feed' as InventoryCategory,
    unit: 'kg',
    current_quantity: 0,
    min_quantity: 0,
    unit_cost: 0,
    barcode: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem(formData);
      onOpenChange(false);
      setFormData({
        name: '',
        category: 'feed',
        unit: 'kg',
        current_quantity: 0,
        min_quantity: 0,
        unit_cost: 0,
        barcode: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Alfalfa hay"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as InventoryCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, liter, unit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Current Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="min_quantity">Min Quantity</Label>
              <Input
                id="min_quantity"
                type="number"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="unit_cost">Unit Cost</Label>
            <Input
              id="unit_cost"
              type="number"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="barcode">Barcode (optional)</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Scan or enter barcode"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
