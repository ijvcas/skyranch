
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Activity, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getHealthRecords } from '@/services/healthRecordService';
import { getAllAnimals } from '@/services/animalService';
import HealthRecordForm from '@/components/HealthRecordForm';
import HealthRecordsListImproved from '@/components/HealthRecordsListImproved';

const HealthRecords: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: () => getAllAnimals(false)
  });

  // Get health records for all animals
  const healthRecordsQueries = useQuery({
    queryKey: ['all-health-records'],
    queryFn: async () => {
      const allRecords = [];
      for (const animal of animals) {
        try {
          const records = await getHealthRecords(animal.id);
          allRecords.push(...records);
        } catch (error) {
          console.error(`Error fetching health records for animal ${animal.id}:`, error);
        }
      }
      return allRecords.sort((a, b) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime());
    },
    enabled: animals.length > 0
  });

  const allHealthRecords = healthRecordsQueries.data || [];

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  // Calculate statistics
  const totalRecords = allHealthRecords.length;
  const totalCost = allHealthRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  const upcomingVaccinations = allHealthRecords.filter(record => {
    if (record.recordType !== 'vaccination' || !record.nextDueDate) return false;
    const dueDate = new Date(record.nextDueDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return dueDate <= thirtyDaysFromNow && dueDate >= new Date();
  }).length;
  
  const recentRecords = allHealthRecords.filter(record => {
    const recordDate = new Date(record.dateAdministered);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return recordDate >= thirtyDaysAgo;
  }).length;

  if (healthRecordsQueries.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold">Registros de Salud</h1>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Registro de Salud</DialogTitle>
            </DialogHeader>
            <HealthRecordForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Recientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRecords}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacunas Próximas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingVaccinations}</div>
            <p className="text-xs text-muted-foreground">Próximos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Health Records List with Search */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los Registros de Salud</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthRecordsListImproved 
            records={allHealthRecords} 
            showAnimalName={true} 
            showSearch={true} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthRecords;
