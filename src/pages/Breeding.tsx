
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Heart, Calendar, TrendingUp, Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBreedingRecords, deleteBreedingRecord, BreedingRecord } from '@/services/breedingService';
import { getAllAnimals } from '@/services/animalService';
import { useToast } from '@/hooks/use-toast';
import { useBreedingNotifications } from '@/hooks/useBreedingNotifications';
import BreedingForm from '@/components/BreedingForm';
import BreedingRecordsList from '@/components/BreedingRecordsList';
import BreedingDetail from '@/components/BreedingDetail';
import BreedingCalendarView from '@/components/BreedingCalendarView';
import BreedingPlanningTab from '@/components/breeding-planning/BreedingPlanningTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Breeding: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerNotificationCheck } = useBreedingNotifications();

  const { data: breedingRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['breeding-records'],
    queryFn: getBreedingRecords
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: getAllAnimals
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBreedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      toast({
        title: "Registro Eliminado",
        description: "El registro de apareamiento ha sido eliminado exitosamente.",
      });
      setSelectedRecord(null);
    },
    onError: (error) => {
      console.error('Error deleting breeding record:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro de apareamiento.",
        variant: "destructive"
      });
    }
  });

  // Create a map of animal IDs to names for display
  const animalNames = animals.reduce((acc, animal) => {
    acc[animal.id] = animal.name;
    return acc;
  }, {} as Record<string, string>);

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleRecordClick = (record: BreedingRecord) => {
    setSelectedRecord(record);
  };

  const handleBackToList = () => {
    setSelectedRecord(null);
  };

  const handleEdit = (record: BreedingRecord) => {
    console.log('Edit record:', record);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro de apareamiento?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTestNotifications = async () => {
    console.log('🔔 Testing pregnancy notifications manually...');
    await triggerNotificationCheck();
  };

  if (isLoadingRecords) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If a record is selected, show the detail view
  if (selectedRecord) {
    return (
      <div className="page-with-logo">
        <div className="container mx-auto px-4 py-8">
          <BreedingDetail
            record={selectedRecord}
            animalNames={animalNames}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-with-logo">
      <div className="container mx-auto px-4 pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold">Gestión de Apareamientos</h1>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleTestNotifications} className="w-full md:w-auto">
              <Bell className="w-4 h-4 mr-2" />
              Probar Notificaciones
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full md:w-auto bg-gradient-blue-green hover:opacity-90 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Apareamiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Apareamiento</DialogTitle>
                </DialogHeader>
                <BreedingForm onSuccess={handleFormSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Apareamientos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{breedingRecords.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Embarazos Confirmados</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {breedingRecords.filter(record => record.pregnancyConfirmed).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partos Completados</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {breedingRecords.filter(record => record.status === 'birth_completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Crías</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {breedingRecords.reduce((total, record) => total + (record.offspringCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
            <TabsTrigger value="planning">Planificación</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Registros de Apareamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <BreedingRecordsList 
                  records={breedingRecords} 
                  animalNames={animalNames}
                  onRecordClick={handleRecordClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Vista de Calendario</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BreedingCalendarView 
                  records={breedingRecords}
                  animalNames={animalNames}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planning">
            <BreedingPlanningTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Breeding;
