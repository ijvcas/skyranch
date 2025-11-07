import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FinancialDashboard } from '@/components/financial/FinancialDashboard';
import { TransactionsList } from '@/components/financial/TransactionsList';
import { ExpenseForm } from '@/components/financial/ExpenseForm';
import { IncomeForm } from '@/components/financial/IncomeForm';
import { useState } from 'react';

const Finances = () => {
  const { t } = useTranslation(['financial', 'common']);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('financial:title')}</h1>
            <p className="text-muted-foreground">{t('financial:subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('financial:transaction.addIncome')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('financial:transaction.addIncome')}</DialogTitle>
              </DialogHeader>
              <IncomeForm 
                onSuccess={() => setIncomeDialogOpen(false)}
                onCancel={() => setIncomeDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('financial:transaction.addExpense')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('financial:transaction.addExpense')}</DialogTitle>
              </DialogHeader>
              <ExpenseForm 
                onSuccess={() => setExpenseDialogOpen(false)}
                onCancel={() => setExpenseDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('financial:tabs.overview')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('financial:tabs.transactions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finances;
