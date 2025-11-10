import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/image-upload';
import { useInventory } from '@/hooks/useInventory';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(['feed', 'medicine', 'supplement', 'equipment', 'other']),
  unit: z.string().min(1, 'Unit is required'),
  current_quantity: z.number().min(0),
  min_quantity: z.number().min(0).optional(),
  max_quantity: z.number().min(0).optional(),
  unit_cost: z.number().min(0).optional(),
  barcode: z.string().optional(),
  supplier: z.string().optional(),
  storage_location: z.string().optional(),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
  invoice_url: z.string().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InventoryItemDialog({ open, onOpenChange }: InventoryItemDialogProps) {
  const { t } = useTranslation('inventory');
  const { createItem } = useInventory();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      category: 'feed',
      unit: '',
      current_quantity: 0,
      min_quantity: undefined,
      max_quantity: undefined,
      unit_cost: undefined,
      barcode: '',
      supplier: '',
      storage_location: '',
      expiry_date: '',
      notes: '',
      image: '',
      invoice_url: '',
    },
  });

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG) or PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setInvoiceFile(file);
  };

  const uploadInvoiceToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploadingInvoice(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `invoices/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('financial-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('financial-receipts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload invoice. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    form.setValue('invoice_url', '');
  };

  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      setIsSubmitting(true);
      
      // Upload invoice if present
      let invoiceUrl = data.invoice_url;
      if (invoiceFile) {
        const uploadedUrl = await uploadInvoiceToStorage(invoiceFile);
        if (uploadedUrl) {
          invoiceUrl = uploadedUrl;
        }
      }
      
      // Remove image and invoice_url from submission data as they're not in the database schema
      const { image, invoice_url, ...itemData } = data;
      // Type assertion is safe here because zod validation ensures required fields are present
      await createItem(itemData as Omit<typeof itemData, 'image'> & { 
        name: string; 
        category: 'feed' | 'medicine' | 'supplement' | 'equipment' | 'other';
        unit: string;
        current_quantity: number;
      });
      form.reset();
      setInvoiceFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating inventory item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addItem')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.image', 'Photo')}</FormLabel>
                  <FormControl>
                    <ImageUpload
                      currentImage={field.value}
                      onImageChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isSubmitting}>
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
                    <FormMessage />
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
                      <Input {...field} placeholder="kg, L, units" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.currentQuantity')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
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
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.maxQuantity')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
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
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.barcode')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.supplier')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.storageLocation')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.expiryDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>{t('fields.invoice', 'Invoice/Receipt')}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {invoiceFile ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{invoiceFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveInvoice}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleInvoiceUpload}
                        disabled={isSubmitting || uploadingInvoice}
                        className="hidden"
                        id="invoice-upload"
                      />
                      <label htmlFor="invoice-upload" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={isSubmitting || uploadingInvoice}
                          asChild
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingInvoice ? t('fields.uploading', 'Uploading...') : t('fields.uploadInvoice', 'Upload Invoice/Receipt')}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('fields.invoiceHelp', 'Upload invoice or receipt (JPG, PNG, or PDF)')}
                  </p>
                </div>
              </FormControl>
            </FormItem>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('addItem')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
