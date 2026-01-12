import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks, type Task } from '@/hooks/useTasks';
import { useAppUsers } from '@/hooks/useAppUsers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFarmWeather } from '@/hooks/useFarmWeather';

const quickLogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  task_type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  completion_notes: z.string().optional(),
  cost: z.string().optional(),
});

type QuickLogFormData = z.infer<typeof quickLogSchema>;

interface QuickLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickLogDialog: React.FC<QuickLogDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation('tasks');
  const { createTask } = useTasks();
  const { data: appUsers = [] } = useAppUsers();
  const { data: currentWeather } = useFarmWeather();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuickLogFormData>({
    resolver: zodResolver(quickLogSchema),
    defaultValues: {
      title: '',
      task_type: 'general',
      description: '',
      assigned_to: '',
      due_date: '',
      completion_notes: '',
      cost: '',
    },
  });

  const onSubmit = async (data: QuickLogFormData) => {
    setIsSubmitting(true);
    try {
      await createTask({
        title: data.title,
        task_type: data.task_type as Task['task_type'],
        description: data.description || '',
        status: 'pending',
        priority: 'medium',
        assigned_to: data.assigned_to || undefined,
        due_date: data.due_date || undefined,
        completion_notes: data.completion_notes || '',
        weather_conditions: currentWeather?.conditionText || '',
        temperature: currentWeather?.temperatureC || null,
        cost: data.cost ? parseFloat(data.cost) : null,
      });
      
      toast.success(t('messages.created'));
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('newTask')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">{t('type.general')}</SelectItem>
                        <SelectItem value="feeding">{t('type.feeding')}</SelectItem>
                        <SelectItem value="health">{t('type.health')}</SelectItem>
                        <SelectItem value="veterinary">{t('type.veterinary')}</SelectItem>
                        <SelectItem value="breeding">{t('type.breeding')}</SelectItem>
                        <SelectItem value="maintenance">{t('type.maintenance')}</SelectItem>
                        <SelectItem value="infrastructure">{t('type.infrastructure')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.assignedTo')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.dueDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completion_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes..." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.cost')} (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentWeather && currentWeather.temperatureC != null && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  {t('fields.weather')}: {currentWeather.conditionText} • {Math.round(currentWeather.temperatureC)}°C
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLogDialog;
