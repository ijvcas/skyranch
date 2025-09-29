import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { formatCostPerSqm } from '@/utils/financialFormatters';

interface FarmLedgerProps {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    totalSales: number;
    totalPayments: number;
    outstandingAmount: number;
  };
}

const FarmLedger: React.FC<FarmLedgerProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => formatCostPerSqm(amount);

  const getIncomeColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Resumen Financiero
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue and Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Ingresos Totales</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Gastos Totales</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Net Income */}
        <div className="text-center space-y-2">
          <span className="text-sm font-medium text-gray-600">Ingreso Neto</span>
          <p className={`text-3xl font-bold ${getIncomeColor(summary.netIncome)}`}>
            {formatCurrency(summary.netIncome)}
          </p>
          {summary.netIncome > 0 && (
            <Badge className="bg-green-100 text-green-800">Rentable</Badge>
          )}
          {summary.netIncome < 0 && (
            <Badge className="bg-red-100 text-red-800">Pérdida</Badge>
          )}
        </div>

        <Separator />

        {/* Sales Summary */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Resumen de Ventas</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Ventas Totales:</span>
              <p className="font-medium">{formatCurrency(summary.totalSales)}</p>
            </div>
            <div>
              <span className="text-gray-600">Pagos Recibidos:</span>
              <p className="font-medium text-green-600">{formatCurrency(summary.totalPayments)}</p>
            </div>
          </div>

          {summary.outstandingAmount > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Monto Pendiente de Cobro
                </span>
              </div>
              <p className="text-lg font-bold text-yellow-700 mt-1">
                {formatCurrency(summary.outstandingAmount)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmLedger;