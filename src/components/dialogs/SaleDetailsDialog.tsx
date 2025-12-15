import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getStatusColor, getStatusText } from '@/utils/animalStatus';
import { DollarSign, User, Calendar, CreditCard, Plus, Mail, Phone, FileText, Activity } from 'lucide-react';
import AnimalBasicInfo from '@/components/animal-detail/AnimalBasicInfo';
import AnimalHealthRecords from '@/components/animal-detail/AnimalHealthRecords';
import HorizontalPedigreeTree from '@/components/HorizontalPedigreeTree';
import AnimalDocuments from '@/components/animal-detail/AnimalDocuments';
import AnimalHistory from '@/components/animal-detail/AnimalHistory';
import { fromDatabase } from '@/services/utils/animalDatabaseMapper';
import type { Animal } from '@/stores/animalStore';

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
  const [sale, setSale] = useState<(AnimalSale & { animals?: any }) | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('sale');
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
      setActiveTab('sale');
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
      
      // Map the animal data if available (handle array or object)
      if (saleData?.animals) {
        const animalData = Array.isArray(saleData.animals) ? saleData.animals[0] : saleData.animals;
        if (animalData) {
          const mappedAnimal = fromDatabase(animalData);
          setAnimal(mappedAnimal);
        }
      }
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
        <DialogContent className="sm:max-w-5xl max-h-[95vh]">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando detalles de la venta...</p>
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
            <p className="text-muted-foreground">No se pudo cargar la información de la venta</p>
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Detalles de Venta - {animal?.name || 'Animal'}
          </DialogTitle>
        </DialogHeader>

        {/* Animal Header */}
        {animal && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            {animal.image ? (
              <img 
                src={animal.image} 
                alt={animal.name} 
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">
                  {animal.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{animal.name}</h2>
              <p className="text-muted-foreground">ID: #{animal.tag}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(animal.healthStatus)}>
                  {getStatusText(animal.healthStatus)}
                </Badge>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Vendido
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="sale">Venta</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="health">
              <Activity className="w-4 h-4 mr-1" />
              Salud
            </TabsTrigger>
            <TabsTrigger value="pedigree">Pedigrí</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          {/* Sale Tab */}
          <TabsContent value="sale" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sale Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Información de la Venta</span>
                    {getPaymentStatusBadge(sale.payment_status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fecha de Venta:</span>
                      <p className="font-medium">{formatDate(sale.sale_date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precio de Venta:</span>
                      <p className="font-bold text-primary text-lg">
                        {formatCostPerSqm(sale.sale_price)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método de Pago:</span>
                      <p className="font-medium capitalize">{sale.payment_method}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estado del Pago:</span>
                      <p className="font-medium capitalize">{sale.payment_status}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Pagado:</span>
                      <p className="font-bold text-green-600 text-lg">
                        {formatCostPerSqm(sale.amount_paid)}
                      </p>
                    </div>
                    {sale.amount_pending > 0 && (
                      <div>
                        <span className="text-muted-foreground">Monto Pendiente:</span>
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
                        <span className="text-muted-foreground flex items-center gap-1 mb-2 text-sm">
                          <FileText className="w-4 h-4" />
                          Notas de la Venta:
                        </span>
                        <p className="text-sm bg-muted p-3 rounded italic">
                          "{sale.sale_notes}"
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Buyer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-5 h-5" />
                    Información del Comprador
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-muted-foreground text-sm">Nombre:</span>
                    <p className="font-medium text-lg">{sale.buyer_name}</p>
                  </div>
                  
                  {sale.buyer_contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">Teléfono:</span>
                      <p className="font-medium">{sale.buyer_contact}</p>
                    </div>
                  )}
                  
                  {sale.buyer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">Email:</span>
                      <p className="font-medium">{sale.buyer_email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Historial de Pagos ({payments.length})
                  </span>
                  {sale.amount_pending > 0 && (
                    <Button
                      onClick={() => setShowAddPayment(!showAddPayment)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Pago
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAddPayment && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted/50">
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
                        className="bg-primary hover:bg-primary/90"
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
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{formatDate(payment.payment_date)}</p>
                            <p className="text-sm text-muted-foreground capitalize">{payment.payment_method}</p>
                            {payment.reference_number && (
                              <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCostPerSqm(payment.amount)}</p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground italic">"{payment.notes}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No hay pagos registrados para esta venta</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab - Animal Basic Info */}
          <TabsContent value="general" className="mt-4">
            {animal ? (
              <AnimalBasicInfo animal={animal} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay información del animal disponible
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-4">
            {animal ? (
              <AnimalHealthRecords animalId={animal.id} animalName={animal.name} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay información del animal disponible
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pedigree Tab */}
          <TabsContent value="pedigree" className="mt-4">
            {animal ? (
              <HorizontalPedigreeTree animal={animal} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay información del animal disponible
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            {animal ? (
              <AnimalDocuments animalId={animal.id} animalName={animal.name} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay información del animal disponible
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            {animal ? (
              <AnimalHistory animal={animal} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay información del animal disponible
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailsDialog;