import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { declareAnimalSold, type SaleFormData } from '@/services/animal/animalSalesService';
import { DollarSign, Calendar, User, CreditCard } from 'lucide-react';

interface SaleConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  animalId: string;
  animalName: string;
  onSaleConfirmed: () => void;
}

const SaleConfirmationDialog: React.FC<SaleConfirmationDialogProps> = ({
  isOpen,
  onClose,
  animalId,
  animalName,
  onSaleConfirmed
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SaleFormData>({
    sale_date: new Date().toISOString().split('T')[0],
    sale_price: 0,
    buyer_name: '',
    buyer_contact: '',
    buyer_email: '',
    payment_method: 'cash',
    amount_paid: 0,
    sale_notes: ''
  });

  const handleInputChange = (field: keyof SaleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validation
      if (!formData.sale_date || !formData.sale_price || !formData.buyer_name || !formData.payment_method) {
        toast({
          title: 'Error',
          description: 'Por favor complete todos los campos requeridos',
          variant: 'destructive'
        });
        return;
      }

      if (formData.sale_price <= 0) {
        toast({
          title: 'Error',
          description: 'El precio de venta debe ser mayor a 0',
          variant: 'destructive'
        });
        return;
      }

      if ((formData.amount_paid || 0) > formData.sale_price) {
        toast({
          title: 'Error',
          description: 'El monto pagado no puede ser mayor al precio de venta',
          variant: 'destructive'
        });
        return;
      }

      await declareAnimalSold(animalId, formData);

      toast({
        title: 'Animal vendido',
        description: `${animalName} ha sido marcado como vendido exitosamente`,
        variant: 'default'
      });

      onSaleConfirmed();
      onClose();
      
      // Reset form
      setFormData({
        sale_date: new Date().toISOString().split('T')[0],
        sale_price: 0,
        buyer_name: '',
        buyer_contact: '',
        buyer_email: '',
        payment_method: 'cash',
        amount_paid: 0,
        sale_notes: ''
      });
    } catch (error) {
      console.error('Error declaring animal sold:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al marcar el animal como vendido',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Vender Animal: {animalName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          {/* Sale Date */}
          <div className="space-y-2">
            <Label htmlFor="sale_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Venta *
            </Label>
            <Input
              id="sale_date"
              type="date"
              value={formData.sale_date}
              onChange={(e) => handleInputChange('sale_date', e.target.value)}
              required
            />
          </div>

          {/* Sale Price */}
          <div className="space-y-2">
            <Label htmlFor="sale_price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Precio de Venta (€) *
            </Label>
            <Input
              id="sale_price"
              type="text"
              value={formData.sale_price ? formData.sale_price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                handleInputChange('sale_price', parseFloat(value) || 0);
              }}
              placeholder="0,00"
              required
            />
          </div>

          {/* Buyer Information */}
          <div className="space-y-2">
            <Label htmlFor="buyer_name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nombre del Comprador *
            </Label>
            <Input
              id="buyer_name"
              type="text"
              value={formData.buyer_name}
              onChange={(e) => handleInputChange('buyer_name', e.target.value)}
              placeholder="Nombre completo del comprador"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="buyer_contact">Teléfono</Label>
              <Input
                id="buyer_contact"
                type="tel"
                value={formData.buyer_contact}
                onChange={(e) => handleInputChange('buyer_contact', e.target.value)}
                placeholder="Teléfono de contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer_email">Email</Label>
              <Input
                id="buyer_email"
                type="email"
                value={formData.buyer_email}
                onChange={(e) => handleInputChange('buyer_email', e.target.value)}
                placeholder="Email del comprador"
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Método de Pago *
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => handleInputChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione método de pago" />
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
            <Label htmlFor="amount_paid">Monto Pagado (€)</Label>
            <Input
              id="amount_paid"
              type="text"
              value={formData.amount_paid ? formData.amount_paid.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                const numValue = parseFloat(value) || 0;
                if (numValue <= formData.sale_price) {
                  handleInputChange('amount_paid', numValue);
                }
              }}
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500">
              Deje en 0 si no se ha recibido pago aún
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="sale_notes">Notas de la Venta</Label>
            <Textarea
              id="sale_notes"
              value={formData.sale_notes}
              onChange={(e) => handleInputChange('sale_notes', e.target.value)}
              placeholder="Información adicional sobre la venta..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Venta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaleConfirmationDialog;