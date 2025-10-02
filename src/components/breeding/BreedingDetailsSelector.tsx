
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import DatePickerField from '@/components/calendar/DatePickerField';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BreedingDetailsSelectorProps {
  breedingDate: string;
  breedingMethod: 'natural' | 'artificial_insemination' | 'embryo_transfer';
  expectedDueDate: string;
  onDateChange: (field: string, value: string) => void;
  onMethodChange: (value: 'natural' | 'artificial_insemination' | 'embryo_transfer') => void;
}

const BreedingDetailsSelector: React.FC<BreedingDetailsSelectorProps> = ({
  breedingDate,
  breedingMethod,
  expectedDueDate,
  onDateChange,
  onMethodChange
}) => {
  const formattedDueDate = expectedDueDate 
    ? format(new Date(expectedDueDate), 'dd/MM/yyyy', { locale: es })
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <DatePickerField
          value={breedingDate}
          onChange={(date) => onDateChange('breedingDate', date)}
          label="Fecha de Apareamiento"
          placeholder="Seleccionar fecha"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="breedingMethod">Método de Apareamiento</Label>
        <Select value={breedingMethod} onValueChange={onMethodChange}>
          <SelectTrigger className="w-full bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[60] bg-white border border-gray-200 shadow-lg">
            <SelectItem value="natural" className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">Natural</SelectItem>
            <SelectItem value="artificial_insemination" className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">Inseminación Artificial</SelectItem>
            <SelectItem value="embryo_transfer" className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">Transferencia de Embriones</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="expectedDueDate" className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Fecha Esperada de Parto
        </Label>
        <Input
          id="expectedDueDate"
          type="text"
          value={formattedDueDate}
          readOnly
          className="bg-muted/50 cursor-not-allowed"
          placeholder="Auto-calculada"
        />
      </div>
    </div>
  );
};

export default BreedingDetailsSelector;
