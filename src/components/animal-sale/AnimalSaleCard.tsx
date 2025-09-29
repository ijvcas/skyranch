import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, User, Calendar, CreditCard, Eye } from 'lucide-react';
import { formatCostPerSqm } from '@/utils/financialFormatters';
import type { AnimalSale } from '@/services/animal/animalSalesService';

interface AnimalSaleCardProps {
  sale: AnimalSale;
  onViewDetails: () => void;
}

const AnimalSaleCard: React.FC<AnimalSaleCardProps> = ({ sale, onViewDetails }) => {
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-red-100 text-red-800">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">
              Venta #{sale.id.slice(-8)}
            </h3>
          </div>
          {getPaymentStatusBadge(sale.payment_status)}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Fecha:</span>
            <span className="font-medium">{formatDate(sale.sale_date)}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Comprador:</span>
            <span className="font-medium">{sale.buyer_name}</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Precio:</span>
            <span className="font-bold text-purple-600">
              {formatCostPerSqm(sale.sale_price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Pagado:</span>
            <span className="font-medium">
              {formatCostPerSqm(sale.amount_paid)}
            </span>
            {sale.amount_pending > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-red-600 font-medium">
                  Pendiente: {formatCostPerSqm(sale.amount_pending)}
                </span>
              </>
            )}
          </div>

          {sale.buyer_contact && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Contacto:</span>
              <span className="text-sm text-gray-800">{sale.buyer_contact}</span>
            </div>
          )}
        </div>

        {sale.sale_notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-600 italic">"{sale.sale_notes}"</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Ver Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimalSaleCard;