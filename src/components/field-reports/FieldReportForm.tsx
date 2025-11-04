
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateFieldReport } from '@/hooks/useFieldReports';
import { useAnimalNames } from '@/hooks/useAnimalNames';
import PregnancyBirthSection from './sections/PregnancyBirthSection';
import VeterinarySection from './sections/VeterinarySection';
import HealthObservationsSection from './sections/HealthObservationsSection';
import InfrastructureSection from './sections/InfrastructureSection';
import GeneralSection from './sections/GeneralSection';

const fieldReportSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  report_type: z.string().min(1, 'El tipo de reporte es requerido'),
  weather_conditions: z.string().optional(),
  temperature: z.number().optional(),
  location_coordinates: z.string().optional(),
  notes: z.string().optional(),
});

type FieldReportFormData = z.infer<typeof fieldReportSchema>;

interface FieldReportFormProps {
  onSuccess: () => void;
}

const FieldReportForm = ({ onSuccess }: FieldReportFormProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [entries, setEntries] = useState<any[]>([]);
  
  const { mutate: createFieldReport, isPending } = useCreateFieldReport();
  const { animalNamesMap } = useAnimalNames();

  // Convert animalNamesMap to array format for the components
  const animalNames = Object.entries(animalNamesMap || {}).map(([id, name]) => ({
    id,
    name: name as string
  }));

  const form = useForm<FieldReportFormData>({
    resolver: zodResolver(fieldReportSchema),
    defaultValues: {
      title: '',
      report_type: 'general',
      weather_conditions: '',
      location_coordinates: '',
      notes: '',
    },
  });

  const onSubmit = (data: FieldReportFormData) => {
    // Ensure all required fields are present
    const reportData = {
      title: data.title,
      report_type: data.report_type,
      weather_conditions: data.weather_conditions,
      temperature: data.temperature,
      location_coordinates: data.location_coordinates,
      notes: data.notes,
      entries,
    };

    createFieldReport(reportData, {
      onSuccess: () => {
        form.reset();
        setEntries([]);
        onSuccess();
      },
    });
  };

  const addEntry = (entry: any) => {
    setEntries(prev => [...prev, entry]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Report Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica del Reporte</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Reporte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Reporte diario - Lote 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="report_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Reporte</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="pregnancy">Embarazo/Nacimiento</SelectItem>
                      <SelectItem value="veterinary">Veterinario</SelectItem>
                      <SelectItem value="health">Salud</SelectItem>
                      <SelectItem value="infrastructure">Infraestructura</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weather_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condiciones Climáticas</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Soleado, lluvioso, nublado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperatura (°C)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="25" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Report Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-col w-full md:grid md:grid-cols-3 lg:grid-cols-5 gap-2 h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pregnancy">Embarazo</TabsTrigger>
            <TabsTrigger value="veterinary">Veterinario</TabsTrigger>
            <TabsTrigger value="health">Salud</TabsTrigger>
            <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSection onAddEntry={addEntry} animals={animalNames} />
          </TabsContent>

          <TabsContent value="pregnancy">
            <PregnancyBirthSection onAddEntry={addEntry} animals={animalNames} />
          </TabsContent>

          <TabsContent value="veterinary">
            <VeterinarySection onAddEntry={addEntry} animals={animalNames} />
          </TabsContent>

          <TabsContent value="health">
            <HealthObservationsSection onAddEntry={addEntry} animals={animalNames} />
          </TabsContent>

          <TabsContent value="infrastructure">
            <InfrastructureSection onAddEntry={addEntry} />
          </TabsContent>
        </Tabs>

        {/* Entries Summary */}
        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Entradas del Reporte ({entries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entries.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{entry.title}</span>
                      <span className="text-sm text-gray-500 ml-2">({entry.entry_type})</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* General Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Generales</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observaciones adicionales del reporte..."
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            {isPending ? 'Guardando...' : 'Guardar Reporte'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FieldReportForm;
