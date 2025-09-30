import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ChevronRight, Calendar, User, CreditCard } from 'lucide-react';
import PageLayout from '@/components/ui/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSalesWithAnimals } from '@/services/animal/animalSalesService';
import { formatCostPerSqm } from '@/utils/financialFormatters';

const SoldAnimals: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['animal-sales'],
    queryFn: getSalesWithAnimals,
  });

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-600">Pagado</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600">Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-red-600">Pendiente</Badge>;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">Animales Vendidos</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/animals')}>
            Volver a Animales
          </Button>
        </div>

        {sales.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No hay ventas registradas</h3>
              <p className="text-muted-foreground">
                Las ventas de animales aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sales.map((sale: any) => (
              <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                      <span>{sale.animals?.name || 'Animal'}</span>
                      <Badge variant="outline">{sale.animals?.species}</Badge>
                    </div>
                    {getPaymentStatusBadge(sale.payment_status)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sale Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de Venta</p>
                        <p className="font-semibold">
                          {new Date(sale.sale_date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Buyer */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Comprador</p>
                        <p className="font-semibold">{sale.buyer_name}</p>
                        {sale.buyer_contact && (
                          <p className="text-sm text-muted-foreground">{sale.buyer_contact}</p>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-start gap-2">
                      <CreditCard className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Método de Pago</p>
                        <p className="font-semibold">{getPaymentMethodLabel(sale.payment_method)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Precio de Venta:</span>
                      <span className="font-bold text-lg">{formatCostPerSqm(sale.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monto Pagado:</span>
                      <span className="font-semibold text-green-600">{formatCostPerSqm(sale.amount_paid)}</span>
                    </div>
                    {sale.amount_paid < sale.total_amount && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-semibold text-red-600">Saldo Pendiente:</span>
                        <span className="font-bold text-red-600">
                          {formatCostPerSqm(sale.total_amount - sale.amount_paid)}
                        </span>
                      </div>
                    )}
                  </div>

                  {sale.sale_notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Notas:</p>
                      <p className="text-foreground">{sale.sale_notes}</p>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/animals/${sale.animal_id}`)}
                  >
                    Ver Detalles del Animal
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SoldAnimals;
