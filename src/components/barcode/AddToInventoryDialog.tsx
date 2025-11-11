import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UniversalProduct } from '@/services/productLookupService';

interface AddToInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: UniversalProduct;
  onSuccess?: () => void;
}

export function AddToInventoryDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: AddToInventoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.product_name,
    category: 'other' as 'feed' | 'medicine' | 'supplement' | 'equipment' | 'other',
    unit: 'units',
    current_quantity: 1,
    min_quantity: 0,
    unit_cost: 0,
    barcode: product.barcode,
    supplier: product.brand || '',
    notes: `Imported from ${product.source}`,
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Not authenticated');
        return;
      }

      const { error } = await supabase.from('inventory_items').insert({
        ...formData,
        user_id: user.user.id,
      });

      if (error) throw error;

      toast.success('Product added to inventory');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product to inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Inventory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {product.image_url && (
            <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.product_name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feed">Feed</SelectItem>
                <SelectItem value="medicine">Medicine</SelectItem>
                <SelectItem value="supplement">Supplements</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Unit Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier/Brand</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add to Inventory'}
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
