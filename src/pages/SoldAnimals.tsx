import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, User, Calendar, CreditCard, Search, Filter as FilterIcon, Edit, Trash2 } from 'lucide-react';
import PageLayout from '@/components/ui/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getSalesWithAnimals, deleteSale } from '@/services/animal/animalSalesService';
import { formatCostPerSqm } from '@/utils/financialFormatters';
import { useToast } from '@/hooks/use-toast';
import EditSaleDialog from '@/components/animal-sale/EditSaleDialog';

const SoldAnimals: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['animal-sales'],
    queryFn: getSalesWithAnimals,
  });

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalSold = sales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
    const totalAnimals = sales.length;
    const pendingPayments = sales.filter(s => s.payment_status !== 'paid').length;
    const totalPending = sales.reduce((sum, sale) => {
      const pending = Number(sale.total_amount || 0) - Number(sale.amount_paid || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);
    
    return { totalSold, totalAnimals, pendingPayments, totalPending };
  }, [sales]);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const animalName = sale.animals?.name?.toLowerCase() || '';
        const buyerName = sale.buyer_name?.toLowerCase() || '';
        if (!animalName.includes(query) && !buyerName.includes(query)) {
          return false;
        }
      }
      
      // Payment status filter
      if (paymentFilter !== 'all' && sale.payment_status !== paymentFilter) {
        return false;
      }
      
      // Payment method filter
      if (methodFilter !== 'all' && sale.payment_method !== methodFilter) {
        return false;
      }
      
      return true;
    });
  }, [sales, searchQuery, paymentFilter, methodFilter]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600 text-white">Pagado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600 text-white">Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-red-600 text-white">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      check: 'Cheque',
      partial: 'Pago Parcial'
    };
    return labels[method] || method;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPaymentFilter('all');
    setMethodFilter('all');
  };

  const handleDeleteSale = async () => {
    if (!deletingSaleId) return;
    
    try {
      setIsDeleting(true);
      await deleteSale(deletingSaleId);
      
      toast({
        title: 'Éxito',
        description: 'Venta eliminada correctamente. El animal ha sido restaurado.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['animal-sales'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setDeletingSaleId(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la venta',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['animal-sales'] });
    setEditingSale(null);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Cargando ventas...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/animals')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Animales Vendidos</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/animals')}>
            Volver a Animales
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Vendido</p>
                  <p className="text-lg font-bold">{formatCostPerSqm(stats.totalSold)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Animales</p>
                  <p className="text-lg font-bold">{stats.totalAnimals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Pagos Pendientes</p>
                  <p className="text-lg font-bold">{stats.pendingPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-orange-600">{formatCostPerSqm(stats.totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-4">Filtros y Búsqueda</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por animal o comprador"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los pagos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <FilterIcon className="w-4 h-4" />
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales History */}
        <div>
          <h2 className="text-xl font-bold mb-4">Historial de Ventas ({filteredSales.length})</h2>
          
          {filteredSales.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No hay ventas que coincidan</h3>
                <p className="text-muted-foreground">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale: any) => {
                const pendingAmount = Number(sale.total_amount || 0) - Number(sale.amount_paid || 0);
                
                return (
                  <Card key={sale.id}>
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                          <h3 className="text-base font-bold truncate">{sale.animals?.name || 'Animal'}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {getPaymentStatusBadge(sale.payment_status)}
                            {pendingAmount > 0 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs px-2 py-0">
                                Saldo: {formatCostPerSqm(pendingAmount)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setEditingSale(sale)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingSaleId(sale.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 gap-3 text-center">
                        {/* Sale Date */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Fecha de Venta</p>
                          <p className="font-semibold text-sm">
                            {new Date(sale.sale_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Buyer */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Comprador</p>
                          <p className="font-semibold text-sm">{sale.buyer_name}</p>
                          {sale.buyer_contact && (
                            <p className="text-xs text-muted-foreground">{sale.buyer_contact}</p>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Precio</p>
                          <p className="font-semibold text-green-600 text-sm">{formatCostPerSqm(sale.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">Pagado: {formatCostPerSqm(sale.amount_paid)}</p>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Método</p>
                          <p className="font-semibold text-sm">{getPaymentMethodLabel(sale.payment_method)}</p>
                          {sale.updated_at && (
                            <p className="text-xs text-muted-foreground">
                              Pagado: {new Date(sale.updated_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Sale Dialog */}
        {editingSale && (
          <EditSaleDialog
            sale={editingSale}
            open={!!editingSale}
            onOpenChange={(open) => !open && setEditingSale(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingSaleId} onOpenChange={(open) => !open && setDeletingSaleId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente el registro de venta. El animal será restaurado a estado activo.
                También se eliminarán todos los pagos asociados y registros contables.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteSale}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
};

export default SoldAnimals;
