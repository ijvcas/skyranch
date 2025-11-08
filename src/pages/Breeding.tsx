
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Heart, Calendar, TrendingUp, Bell, Activity, Archive } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBreedingRecords, deleteBreedingRecord, BreedingRecord } from '@/services/breedingService';
import { getAnimalsByIds } from '@/services/animal/animalQueries';
import { useToast } from '@/hooks/use-toast';
import { useBreedingNotifications } from '@/hooks/useBreedingNotifications';
import BreedingForm from '@/components/BreedingForm';
import BreedingRecordsList from '@/components/BreedingRecordsList';
import BreedingDetail from '@/components/BreedingDetail';
import BreedingCalendarView from '@/components/BreedingCalendarView';
import BreedingPlanningTab from '@/components/breeding-planning/BreedingPlanningTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabTrigger as GridTabTrigger, TabsListGrid } from '@/components/breeding/BreedingTabsGrid';

const Breeding: React.FC = () => {
  const { t } = useTranslation('breeding');
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(null);
  const [activeTab, setActiveTab] = useState('activos');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerNotificationCheck } = useBreedingNotifications();

  const { data: breedingRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['breeding-records'],
    queryFn: getBreedingRecords
  });

  // Extract all unique animal IDs from breeding records
  const animalIds = React.useMemo(() => {
    const ids = new Set<string>();
    breedingRecords.forEach(record => {
      if (record.motherId) ids.add(record.motherId);
      if (record.fatherId) ids.add(record.fatherId);
    });
    return Array.from(ids);
  }, [breedingRecords]);

  // Fetch only the animals that appear in breeding records
  const { data: animalNames = {} } = useQuery({
    queryKey: ['breeding-animal-names', animalIds],
    queryFn: () => getAnimalsByIds(animalIds),
    enabled: animalIds.length > 0
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBreedingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records'] });
      toast({
        title: t('messages.deleted'),
        description: t('messages.deleteSuccess'),
      });
      setSelectedRecord(null);
    },
    onError: (error) => {
      console.error('Error deleting breeding record:', error);
      toast({
        title: t('common:error'),
        description: t('messages.deleteError'),
        variant: "destructive"
      });
    }
  });


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
    if (window.confirm(t('deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleTestNotifications = async () => {
    console.log('🔔 Testing pregnancy notifications manually...');
    await triggerNotificationCheck();
  };

  // Filter records into active and completed
  const activeRecords = React.useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    
    return breedingRecords.filter(record => {
      if (record.status === 'planned' || record.status === 'completed' || record.status === 'confirmed_pregnant') {
        return true;
      }
      if (record.status === 'not_pregnant') {
        const recordDate = new Date(record.breedingDate);
        return recordDate > cutoffDate;
      }
      return false;
    });
  }, [breedingRecords]);

  const completedRecords = React.useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    
    return breedingRecords.filter(record => {
      if (record.status === 'birth_completed' || record.status === 'failed') {
        return true;
      }
      if (record.status === 'not_pregnant') {
        const recordDate = new Date(record.breedingDate);
        return recordDate <= cutoffDate;
      }
      return false;
    });
  }, [breedingRecords]);

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
            <h1 className="text-2xl font-bold">{t('management')}</h1>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleTestNotifications} className="w-full md:w-auto">
              <Bell className="w-4 h-4 mr-2" />
              {t('testNotifications')}
            </Button>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full md:w-auto bg-gradient-blue-green hover:opacity-90 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addRecord')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('registerNew')}</DialogTitle>
                </DialogHeader>
                <BreedingForm onSuccess={handleFormSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">{t('stats.active')}</CardTitle>
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{activeRecords.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">{t('stats.completed')}</CardTitle>
              <Archive className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{completedRecords.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium leading-tight">{t('stats.confirmed')}</CardTitle>
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {breedingRecords.filter(record => record.pregnancyConfirmed).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">{t('stats.totalOffspring')}</CardTitle>
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {breedingRecords.reduce((total, record) => total + (record.offspringCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsListGrid>
            <GridTabTrigger
              value="activos"
              icon={<Activity />}
              label={t('tabs.active')}
              isActive={activeTab === 'activos'}
              onClick={() => setActiveTab('activos')}
            />
            <GridTabTrigger
              value="historial"
              icon={<Archive />}
              label={t('tabs.history')}
              isActive={activeTab === 'historial'}
              onClick={() => setActiveTab('historial')}
            />
            <GridTabTrigger
              value="calendar"
              icon={<Calendar />}
              label={t('tabs.calendar')}
              isActive={activeTab === 'calendar'}
              onClick={() => setActiveTab('calendar')}
            />
            <GridTabTrigger
              value="planning"
              icon={<TrendingUp />}
              label={t('tabs.planning')}
              isActive={activeTab === 'planning'}
              onClick={() => setActiveTab('planning')}
            />
          </TabsListGrid>

          <TabsContent value="activos">
            <Card>
              <CardHeader>
                <CardTitle>{t('activeBreedings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <BreedingRecordsList 
                  records={activeRecords} 
                  animalNames={animalNames}
                  onRecordClick={handleRecordClick}
                  emptyMessage={t('empty.active')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle>{t('breedingHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <BreedingRecordsList 
                  records={completedRecords} 
                  animalNames={animalNames}
                  onRecordClick={handleRecordClick}
                  emptyMessage={t('empty.history')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{t('calendar.view')}</span>
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
