import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import WeatherWidget from '@/components/weather/WeatherWidget';
import DashboardBanner from '@/components/dashboard/DashboardBanner';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAnimalStore } from '@/stores/animalStore';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const Dashboard = () => {
  const { user } = useAuth();
  const { animals, isLoading, loadAnimals } = useAnimalStore();

  useEffect(() => {
    if (user) {
      loadAnimals();
    }
  }, [user, loadAnimals]);

  const handleForceRefresh = () => {
    console.log('🔄 DASHBOARD: Force refresh triggered!');
    loadAnimals();
  };

  if (isLoading) {
    return (
      <div className="page-with-logo">
        <DashboardBanner />
        <LoadingState message="Cargando datos del dashboard..." />
      </div>
    );
  }

  return (
    <div className="page-with-logo">
      <DashboardBanner />
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <DashboardHeader 
              userName={user?.user_metadata?.full_name}
              userEmail={user?.email}
              totalAnimals={animals.length}
              onForceRefresh={handleForceRefresh}
            />
            
            <DashboardQuickActions />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WeatherWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;