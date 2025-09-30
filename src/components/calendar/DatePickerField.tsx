
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const DatePickerField = ({ value, onChange, label, placeholder = "Seleccionar fecha", required = false }: DatePickerFieldProps) => {
  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD for consistency
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
        {label} {required && '*'}
      </Label>
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-background border shadow-lg !z-[10000]" 
          align="start"
          sideOffset={5}
        >
          <EnhancedCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            showNavigationHeader={true}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePickerField;
