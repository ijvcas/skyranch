import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, User, Calendar, CreditCard, Search, Filter as FilterIcon, Edit } from 'lucide-react';
import PageLayout from '@/components/ui/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSalesWithAnimals } from '@/services/animal/animalSalesService';
import { formatCostPerSqm } from '@/utils/financialFormatters';

const SoldAnimals: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendido</p>
                  <p className="text-2xl font-bold">{formatCostPerSqm(stats.totalSold)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Animales Vendidos</p>
                  <p className="text-2xl font-bold">{stats.totalAnimals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCostPerSqm(stats.totalPending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Filtros y Búsqueda</h2>
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
          <h2 className="text-2xl font-bold mb-4">Historial de Ventas ({filteredSales.length})</h2>
          
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
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-6 h-6 text-primary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">{sale.animals?.name || 'Animal'}</h3>
                              {sale.animals?.species && (
                                <span className="text-sm text-muted-foreground">
                                  {sale.animals.breed ? `${sale.animals.breed} - ` : ''}{sale.animals.species.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(sale.payment_status)}
                          {pendingAmount > 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Saldo: {formatCostPerSqm(pendingAmount)}
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        {/* Sale Date */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Fecha de Venta</p>
                          <p className="font-semibold">
                            {new Date(sale.sale_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Buyer */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Comprador</p>
                          <p className="font-semibold">{sale.buyer_name}</p>
                          {sale.buyer_contact && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {sale.buyer_contact}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Precio</p>
                          <p className="font-semibold text-green-600">{formatCostPerSqm(sale.total_amount)}</p>
                          <p className="text-sm text-muted-foreground">Pagado: {formatCostPerSqm(sale.amount_paid)}</p>
                        </div>

                        {/* Payment Method */}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Método</p>
                          <p className="font-semibold">{getPaymentMethodLabel(sale.payment_method)}</p>
                          {sale.updated_at && (
                            <p className="text-sm text-muted-foreground">
                              Pagado: {new Date(sale.updated_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Button */}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/animals/${sale.animal_id}`)}
                      >
                        Ver Detalles del Animal
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SoldAnimals;
