import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { InventoryItem } from '@/hooks/useInventory';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string;
  onSave: (item: any) => Promise<void>;
}

export function InventoryDialog({ open, onOpenChange, itemId, onSave }: InventoryDialogProps) {
  const { t } = useTranslation('inventory');
  const form = useForm<Partial<InventoryItem>>({
    defaultValues: {
      name: '',
      category: 'feed',
      unit: 'kg',
      current_quantity: 0,
    },
  });

  const handleSubmit = async (data: Partial<InventoryItem>) => {
    await onSave(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {itemId ? 'Edit Item' : t('addItem')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="feed">{t('category.feed')}</SelectItem>
                        <SelectItem value="medicine">{t('category.medicine')}</SelectItem>
                        <SelectItem value="supplement">{t('category.supplement')}</SelectItem>
                        <SelectItem value="equipment">{t('category.equipment')}</SelectItem>
                        <SelectItem value="other">{t('category.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.unit')}</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="current_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.currentQuantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} required />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.minQuantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.unitCost')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storage_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.storageLocation')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}