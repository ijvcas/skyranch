import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  getSaleDetails, 
  getSalePayments, 
  addPaymentToSale,
  type AnimalSale, 
  type SalePayment,
  type PaymentFormData 
} from '@/services/animal/animalSalesService';
import { formatCostPerSqm } from '@/utils/financialFormatters';
import { DollarSign, User, Calendar, CreditCard, Plus, Mail, Phone, FileText } from 'lucide-react';

interface SaleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
}

const SaleDetailsDialog: React.FC<SaleDetailsDialogProps> = ({
  isOpen,
  onClose,
  saleId
}) => {
  const { toast } = useToast();
  const [sale, setSale] = useState<AnimalSale | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && saleId) {
      loadSaleData();
    }
  }, [isOpen, saleId]);

  const loadSaleData = async () => {
    try {
      setLoading(true);
      const [saleData, paymentsData] = await Promise.all([
        getSaleDetails(saleId),
        getSalePayments(saleId)
      ]);
      
      setSale(saleData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading sale data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los datos de la venta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!sale) return;

    try {
      setIsSubmitting(true);

      // Validation
      if (!paymentForm.payment_date || !paymentForm.amount || !paymentForm.payment_method) {
        toast({
          title: 'Error',
          description: 'Por favor complete todos los campos requeridos',
          variant: 'destructive'
        });
        return;
      }

      if (paymentForm.amount <= 0) {
        toast({
          title: 'Error',
          description: 'El monto del pago debe ser mayor a 0',
          variant: 'destructive'
        });
        return;
      }

      await addPaymentToSale(saleId, paymentForm);

      toast({
        title: 'Pago agregado',
        description: 'El pago ha sido registrado exitosamente',
        variant: 'default'
      });

      // Reset form and reload data
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        payment_method: 'cash',
        reference_number: '',
        notes: ''
      });
      setShowAddPayment(false);
      await loadSaleData();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al agregar el pago',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado Completo</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Pago Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pago Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando detalles de la venta...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!sale) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <p className="text-gray-600">No se pudo cargar la información de la venta</p>
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Detalles de Venta #{sale.id.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Información de la Venta</span>
                {getPaymentStatusBadge(sale.payment_status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Fecha de Venta:</span>
                  <p className="font-medium">{formatDate(sale.sale_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Precio de Venta:</span>
                  <p className="font-bold text-purple-600 text-lg">
                    {formatCostPerSqm(sale.sale_price)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Método de Pago:</span>
                  <p className="font-medium capitalize">{sale.payment_method}</p>
                </div>
                <div>
                  <span className="text-gray-600">Estado del Pago:</span>
                  <p className="font-medium capitalize">{sale.payment_status}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Pagado:</span>
                  <p className="font-bold text-green-600 text-lg">
                    {formatCostPerSqm(sale.amount_paid)}
                  </p>
                </div>
                {sale.amount_pending > 0 && (
                  <div>
                    <span className="text-gray-600">Monto Pendiente:</span>
                    <p className="font-bold text-red-600 text-lg">
                      {formatCostPerSqm(sale.amount_pending)}
                    </p>
                  </div>
                )}
              </div>

              {sale.sale_notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-gray-600 flex items-center gap-1 mb-2">
                      <FileText className="w-4 h-4" />
                      Notas de la Venta:
                    </span>
                    <p className="text-sm bg-gray-50 p-3 rounded italic">
                      "{sale.sale_notes}"
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Comprador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="font-medium text-lg">{sale.buyer_name}</p>
              </div>
              
              {sale.buyer_contact && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Teléfono:</span>
                  <p className="font-medium">{sale.buyer_contact}</p>
                </div>
              )}
              
              {sale.buyer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{sale.buyer_email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Historial de Pagos ({payments.length})
              </span>
              {sale.amount_pending > 0 && (
                <Button
                  onClick={() => setShowAddPayment(!showAddPayment)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Pago
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showAddPayment && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-4">Agregar Nuevo Pago</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha del Pago *</Label>
                    <Input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Monto (€) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max={sale.amount_pending}
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder={`Máximo: ${sale.amount_pending.toFixed(2)}`}
                    />
                  </div>
                  <div>
                    <Label>Método de Pago *</Label>
                    <Select
                      value={paymentForm.payment_method}
                      onValueChange={(value) => setPaymentForm(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="check">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número de Referencia</Label>
                    <Input
                      value={paymentForm.reference_number}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                      placeholder="Núm. transferencia, cheque, etc."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas adicionales sobre el pago..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleAddPayment}
                    disabled={isSubmitting}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? 'Agregando...' : 'Agregar Pago'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPayment(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{formatDate(payment.payment_date)}</p>
                        <p className="text-sm text-gray-600 capitalize">{payment.payment_method}</p>
                        {payment.reference_number && (
                          <p className="text-xs text-gray-500">Ref: {payment.reference_number}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCostPerSqm(payment.amount)}</p>
                      {payment.notes && (
                        <p className="text-xs text-gray-500 italic">"{payment.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay pagos registrados para esta venta</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailsDialog;