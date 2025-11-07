import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addLedgerEntry } from '@/services/farmLedgerService';
import { getExpenseCategories, uploadReceipt } from '@/services/financial/expenseService';
import { useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExpenseFormData {
  amount: number;
  category: string;
  payment_method: string;
  description: string;
  transaction_date: string;
  tags?: string;
}

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ExpenseForm = ({ onSuccess, onCancel }: ExpenseFormProps) => {
  const { t } = useTranslation(['financial', 'common']);
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: getExpenseCategories
  });

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>();

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      setUploading(true);
      
      let receiptUrl: string | null = null;
      if (receipt) {
        receiptUrl = await uploadReceipt(receipt);
      }

      const tags = data.tags ? data.tags.split(',').map(t => t.trim()) : [];

      await addLedgerEntry({
        transaction_type: 'expense',
        amount: -Math.abs(data.amount),
        description: data.description,
        transaction_date: data.transaction_date,
        category: data.category,
        payment_method: data.payment_method,
        receipt_url: receiptUrl || undefined,
        tags,
        metadata: {}
      });

      toast({
        title: t('financial:messages.transactionAdded'),
      });

      reset();
      setReceipt(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: t('common:error'),
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{t('financial:transaction.amount')} *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { required: true, min: 0.01 })}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-sm text-destructive">{t('common:validation.required')}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction_date">{t('financial:transaction.date')} *</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register('transaction_date', { required: true })}
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t('financial:transaction.category')} *</Label>
          <Select {...register('category', { required: true })}>
            <SelectTrigger>
              <SelectValue placeholder={t('common:actions.select')} />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">{t('financial:transaction.paymentMethod')} *</Label>
          <Select {...register('payment_method', { required: true })}>
            <SelectTrigger>
              <SelectValue placeholder={t('common:actions.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">{t('financial:paymentMethods.cash')}</SelectItem>
              <SelectItem value="bank_transfer">{t('financial:paymentMethods.bank_transfer')}</SelectItem>
              <SelectItem value="card">{t('financial:paymentMethods.card')}</SelectItem>
              <SelectItem value="check">{t('financial:paymentMethods.check')}</SelectItem>
              <SelectItem value="other">{t('financial:paymentMethods.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('financial:transaction.description')} *</Label>
        <Textarea
          id="description"
          {...register('description', { required: true })}
          placeholder={t('financial:transaction.description')}
          rows={3}
        />
        {errors.description && <p className="text-sm text-destructive">{t('common:validation.required')}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{t('financial:transaction.tags')} ({t('common:optional')})</Label>
        <Input
          id="tags"
          {...register('tags')}
          placeholder="etiqueta1, etiqueta2"
        />
      </div>

      <div className="space-y-2">
        <Label>{t('financial:transaction.receipt')} ({t('common:optional')})</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="receipt-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('receipt-upload')?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {receipt ? receipt.name : t('financial:transaction.uploadReceipt')}
          </Button>
          {receipt && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setReceipt(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common:actions.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={uploading}>
          {uploading ? t('common:common.loading') : t('common:actions.save')}
        </Button>
      </div>
    </form>
  );
};
