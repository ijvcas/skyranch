import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateSale, type AnimalSale, type SaleFormData } from '@/services/animal/animalSalesService';
import { useToast } from '@/hooks/use-toast';

interface EditSaleDialogProps {
  sale: AnimalSale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditSaleDialog: React.FC<EditSaleDialogProps> = ({ sale, open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<SaleFormData>>({
    sale_date: sale.sale_date,
    sale_price: sale.sale_price,
    buyer_name: sale.buyer_name,
    buyer_contact: sale.buyer_contact || '',
    buyer_email: sale.buyer_email || '',
    payment_method: sale.payment_method,
    sale_notes: sale.sale_notes || ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        sale_date: sale.sale_date,
        sale_price: sale.sale_price,
        buyer_name: sale.buyer_name,
        buyer_contact: sale.buyer_contact || '',
        buyer_email: sale.buyer_email || '',
        payment_method: sale.payment_method,
        sale_notes: sale.sale_notes || ''
      });
    }
  }, [open, sale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await updateSale(sale.id, formData);
      
      toast({
        title: 'Éxito',
        description: 'Venta actualizada correctamente'
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la venta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Venta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sale_date">Fecha de Venta *</Label>
            <Input
              id="sale_date"
              type="date"
              value={formData.sale_date}
              onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_price">Precio de Venta (€) *</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer_name">Nombre del Comprador *</Label>
            <Input
              id="buyer_name"
              value={formData.buyer_name}
              onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer_contact">Contacto del Comprador</Label>
            <Input
              id="buyer_contact"
              value={formData.buyer_contact}
              onChange={(e) => setFormData({ ...formData, buyer_contact: e.target.value })}
              placeholder="Teléfono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer_email">Email del Comprador</Label>
            <Input
              id="buyer_email"
              type="email"
              value={formData.buyer_email}
              onChange={(e) => setFormData({ ...formData, buyer_email: e.target.value })}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="partial">Pago Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_notes">Notas</Label>
            <Textarea
              id="sale_notes"
              value={formData.sale_notes}
              onChange={(e) => setFormData({ ...formData, sale_notes: e.target.value })}
              placeholder="Notas adicionales sobre la venta..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSaleDialog;
