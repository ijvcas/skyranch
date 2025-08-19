import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import WeatherWidget from '@/components/weather/WeatherWidget';
import DashboardBanner from '@/components/dashboard/DashboardBanner';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAnimalStore } from '@/stores/animalStore';
import { getAnimalsEmergency } from '@/services/animalServiceEmergency';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const Dashboard = () => {
  const { user } = useAuth();
  const { isReady, shouldWait } = useAuthGuard();
  const { animals, isLoading, loadAnimals } = useAnimalStore();
  const [stats, setStats] = React.useState({ total_count: 0, species_counts: {} });

  useEffect(() => {
    if (isReady && !isLoading && animals.length === 0) {
      console.log('🔄 Dashboard: Loading animals for authenticated user');
      loadAnimals();
      
      // Also load stats with user ID
      const loadStats = async () => {
        try {
          const result = await getAnimalsEmergency(user?.id);
          setStats(result.stats);
        } catch (error) {
          console.error('Failed to load stats:', error);
        }
      };
      loadStats();
    }
  }, [isReady, loadAnimals, isLoading, animals.length]);

  const handleForceRefresh = async () => {
    console.log('🔄 DASHBOARD: Force refresh triggered!');
    loadAnimals();
    
    // Also refresh stats with user ID
    try {
      const result = await getAnimalsEmergency(user?.id);
      setStats(result.stats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  if (shouldWait) {
    return (
      <div className="page-with-logo">
        <DashboardBanner />
        <LoadingState message="Autenticando usuario..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-with-logo">
        <DashboardBanner />
        <LoadingState message="Cargando animales..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="page-with-logo">
        <DashboardBanner />
        
        <div className="container mx-auto py-6 space-y-6">
          <ErrorBoundary>
            <DashboardStats 
              totalAnimals={stats.total_count || animals.length}
              speciesCounts={stats.species_counts || {}}
            />
          </ErrorBoundary>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <ErrorBoundary>
                <DashboardHeader 
                  userName={user?.user_metadata?.full_name}
                  userEmail={user?.email}
                  totalAnimals={stats.total_count || animals.length}
                  onForceRefresh={handleForceRefresh}
                />
              </ErrorBoundary>
              
              <ErrorBoundary>
                <DashboardQuickActions />
              </ErrorBoundary>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ErrorBoundary fallback={
                <div className="text-sm text-muted-foreground">
                  Widget del clima no disponible
                </div>
              }>
                <WeatherWidget />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;