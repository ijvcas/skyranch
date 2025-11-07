import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getLedgerSummary, getCategoryBreakdown } from '@/services/farmLedgerService';
import { useTimezone } from '@/hooks/useTimezone';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FinancialDashboard = () => {
  const { t } = useTranslation(['financial', 'common']);
  const { formatCurrency } = useTimezone();

  const { data: summary } = useQuery({
    queryKey: ['ledger-summary'],
    queryFn: () => getLedgerSummary()
  });

  const { data: breakdown = {} } = useQuery({
    queryKey: ['category-breakdown'],
    queryFn: () => getCategoryBreakdown()
  });

  const profitMargin = summary?.totalRevenue 
    ? ((summary.netIncome / summary.totalRevenue) * 100).toFixed(1)
    : '0.0';

  const isProfit = (summary?.netIncome || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financial:metrics.totalRevenue')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financial:metrics.totalExpenses')}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financial:metrics.netIncome')}
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${isProfit ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.netIncome || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('financial:metrics.profitMargin')}
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitMargin}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Payments Alert */}
      {summary && summary.outstandingAmount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              {t('financial:metrics.totalSales')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              {formatCurrency(summary.outstandingAmount)} pendientes de cobro
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financial:dashboard.categoryBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(breakdown).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('common:common.noData')}
              </p>
            ) : (
              Object.entries(breakdown).map(([category, data]: [string, any]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <div className="flex gap-4 text-sm">
                      {data.income > 0 && (
                        <span className="text-green-600">
                          +{formatCurrency(data.income)}
                        </span>
                      )}
                      {data.expenses > 0 && (
                        <span className="text-red-600">
                          -{formatCurrency(data.expenses)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${Math.min((data.count / 10) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
