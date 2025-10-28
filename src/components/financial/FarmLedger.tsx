import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, DollarSign, Calendar, CreditCard, PiggyBank, AlertCircle, Info } from 'lucide-react';
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
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    if (amount < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const profitMargin = summary.totalRevenue > 0 
    ? ((summary.netIncome / summary.totalRevenue) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Main Financial Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sales vs Payments Notice */}
          {summary.totalSales > 0 && summary.totalPayments === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Hay ventas registradas (€{summary.totalSales.toFixed(2)}) pero aún no se han registrado pagos recibidos.
              </AlertDescription>
            </Alert>
          )}
          {summary.totalSales === 0 && summary.totalExpenses > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                No hay ventas registradas. Los gastos mostrados (€{summary.totalExpenses.toFixed(2)}) 
                incluyen costos veterinarios y otros gastos operativos.
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Pagos Cobrados</span>
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.totalRevenue === 0 ? 'Sin cobros' : 'Efectivo recibido'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-muted-foreground">Gastos</span>
              </div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.totalExpenses > 0 ? 'Veterinario + Otros' : 'Sin gastos'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <PiggyBank className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">Beneficio/Pérdida</span>
              </div>
              <p className={`text-lg font-bold ${getIncomeColor(summary.netIncome)}`}>
                {formatCurrency(summary.netIncome)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.totalRevenue === 0 && summary.netIncome < 0 ? 'Solo gastos' : 'Neto'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-muted-foreground">Margen</span>
              </div>
              <p className={`text-lg font-bold ${getIncomeColor(summary.netIncome)}`}>
                {profitMargin}%
              </p>
              <p className="text-xs text-muted-foreground">Beneficio</p>
            </div>
          </div>

          <Separator />

          {/* Profit/Loss Analysis */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado Financiero</span>
              {summary.netIncome > 0 ? (
                <Badge variant="default" className="bg-green-600">Rentable</Badge>
              ) : summary.netIncome < 0 ? (
                <Badge variant="destructive">Pérdida</Badge>
              ) : (
                <Badge variant="secondary">Punto de Equilibrio</Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventas Totales:</span>
                <span className="font-medium">{formatCurrency(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagos Cobrados:</span>
                <span className="font-medium text-green-600">{formatCurrency(summary.totalPayments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gastos Operativos:</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.totalExpenses)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Resultado Neto:</span>
                <span className={getIncomeColor(summary.netIncome)}>
                  {formatCurrency(summary.netIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Outstanding Amount Alert */}
          {summary.outstandingAmount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      Cuentas por Cobrar
                    </span>
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-500">
                      {formatCurrency(summary.outstandingAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700/80 dark:text-yellow-500/80">
                    Monto pendiente de cobro de ventas realizadas
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmLedger;