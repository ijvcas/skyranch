import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLedgerEntries, type FarmLedgerEntry } from '@/services/farmLedgerService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTimezone } from '@/hooks/useTimezone';
import { Eye, Search, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TransactionsList = () => {
  const { t } = useTranslation(['financial', 'common']);
  const { formatCurrency, formatDate } = useTimezone();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['ledger-entries'],
    queryFn: () => getLedgerEntries()
  });

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    if (type === 'income' || type === 'sale') return 'bg-green-100 text-green-800';
    if (type === 'expense') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getTypeLabel = (type: string) => {
    if (type === 'income' || type === 'sale') return t('financial:types.income');
    if (type === 'expense') return t('financial:types.expense');
    return type;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common:actions.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('financial:dashboard.recentTransactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('common:common.loading')}
            </p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('common:common.noData')}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(transaction.transaction_type)}>
                        {getTypeLabel(transaction.transaction_type)}
                      </Badge>
                      {transaction.category && (
                        <Badge variant="outline" className="capitalize">
                          {transaction.category}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.payment_method}
                        </p>
                      )}
                    </div>
                    {transaction.receipt_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={transaction.receipt_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
