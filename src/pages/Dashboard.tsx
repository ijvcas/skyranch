import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/userService';
import { dashboardBannerService } from '@/services/dashboardBannerService';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardSupportInfo from '@/components/dashboard/DashboardSupportInfo';
import ErrorBoundary from '@/components/ErrorBoundary';
import { applySEO, injectJSONLD } from '@/utils/seo';
import { performHealthCheck, getAnimalsData } from '@/services/coreDataService';


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bannerImage, setBannerImage] = useState<string>('/lovable-uploads/d3c33c19-f7cd-441e-884f-371ed6481179.png');
  const [userName, setUserName] = useState<string>('');
  
  // SEO metadata
  useEffect(() => {
    applySEO({
      title: 'SKYRANCH Dashboard — Farm management',
      description: 'Gestiona animales, lotes y rotaciones en tiempo real en SKYRANCH.',
      canonical: window.location.href
    });
    
    injectJSONLD({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SKYRANCH',
      url: window.location.origin,
      description: 'Gestión moderna de granjas: animales, lotes y rotaciones.'
    });
  }, []);
  
  // Load banner image and user data with health check
  useEffect(() => {
    const loadDashboardResources = async () => {
      try {
        // Run health check first
        console.log('🏥 DASHBOARD: Running initial health check...');
        const health = await performHealthCheck();
        console.log('🏥 DASHBOARD: Health status:', health);
        
        if (!health.isHealthy) {
          toast({
            title: "Sistema con problemas",
            description: "Algunos servicios pueden no estar disponibles",
            variant: "destructive"
          });
        }
        
        // Load banner
        try {
          const bannerData = await dashboardBannerService.getBanner();
          if (bannerData?.image_url) {
            setBannerImage(bannerData.image_url);
          }
        } catch (error) {
          console.error('⚠️ Error loading banner:', error);
          // Keep default fallback image
        }
        
        // Load user data
        try {
          const userData = await getCurrentUser();
          if (userData?.name) {
            setUserName(userData.name);
          }
        } catch (error) {
          console.error('⚠️ Error loading user data:', error);
          // Fallback to email if name not available
        }
      } catch (error) {
        console.error('❌ Error in dashboard resource loading:', error);
        toast({
          title: "Error de carga",
          description: "Algunos recursos del dashboard no se pudieron cargar",
          variant: "destructive"
        });
      }
    };
    
    loadDashboardResources();
  }, [toast]);
  
  // Enhanced state management with health monitoring
  const [dashboardStats, setDashboardStats] = useState<{species_counts: Record<string, number>, total_count: number}>({
    species_counts: {},
    total_count: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Core data fetching function using new service
  const fetchDashboardData = async () => {
    console.log('🔄 DASHBOARD: Starting comprehensive data fetch...');
    
    if (!user?.id) {
      console.log('❌ DASHBOARD: No user ID available');
      return;
    }

    setIsLoading(true);

    try {
      // Health check first
      const health = await performHealthCheck();
      setHealthStatus(health);
      console.log('🏥 DASHBOARD: Health check result:', health);
      
      if (!health.isHealthy) {
        console.warn('⚠️ DASHBOARD: System unhealthy, setting empty data');
        setDashboardStats({ species_counts: {}, total_count: 0 });
        return;
      }

      // Fetch animals data using the new service
      console.log('🔍 DASHBOARD: Fetching animals data...');
      const animalsData = await getAnimalsData();
      console.log('📊 DASHBOARD: Animals data received:', animalsData?.length || 0);

      if (!animalsData || animalsData.length === 0) {
        console.log('📊 DASHBOARD: No animals found');
        setDashboardStats({ species_counts: {}, total_count: 0 });
        return;
      }

      // Process animals for dashboard stats
      const activeAnimals = animalsData.filter(animal => 
        animal.lifecycle_status !== 'deceased'
      );
      
      console.log('📊 DASHBOARD: Active animals:', activeAnimals.length);

      // Calculate species counts
      const speciesCounts = activeAnimals.reduce((acc: Record<string, number>, animal) => {
        const species = animal.species || 'Sin especificar';
        acc[species] = (acc[species] || 0) + 1;
        return acc;
      }, {});

      const result = {
        species_counts: speciesCounts,
        total_count: activeAnimals.length
      };

      console.log('✅ DASHBOARD: Final stats:', result);
      setDashboardStats(result);

    } catch (error) {
      console.error('❌ DASHBOARD: Exception in data fetch:', error);
      setDashboardStats({ species_counts: {}, total_count: 0 });
      setHealthStatus({ isHealthy: false, auth: false, database: false, userRole: null });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 DASHBOARD: Component mounted, fetching data...');
      fetchDashboardData();
    } else if (user === null) {
      console.log('❌ DASHBOARD: No user, skipping data fetch');
      setIsLoading(false);
    }
  }, [user?.id]);

  // Enhanced force refresh
  const handleForceRefresh = async () => {
    console.log('🔄 DASHBOARD: Force refresh triggered!');
    
    await fetchDashboardData();
    
    const statusMessage = healthStatus?.isHealthy 
      ? "Dashboard actualizado correctamente"
      : "Dashboard actualizado con problemas del sistema";
    
    toast({
      title: "Actualización completa",
      description: statusMessage,
      variant: healthStatus?.isHealthy ? "default" : "destructive"
    });
  };

  // Define refetch as alias for compatibility
  const refetch = fetchDashboardData;

  // Extract stats from the optimized query result
  const totalAnimals = dashboardStats?.total_count || 0;
  const speciesCounts = dashboardStats?.species_counts || {};

  const handleSignOut = async () => {
    console.log('🚪 SIGN OUT CLICKED');
    try {
      console.log('🔄 Calling signOut function...');
      await signOut();
      
      // Force clear React Query cache
      queryClient.clear();
      
      // Force navigation to login
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Force navigation even if signOut fails
      window.location.href = '/login';
    }
  };

  // Dashboard always loads immediately - no blocking on data
  // Show loading only for authentication, not for data


  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Health status indicator */}
        {healthStatus && !healthStatus.isHealthy && (
          <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm">
            ⚠️ Sistema con problemas: Auth: {healthStatus.auth ? '✅' : '❌'} | DB: {healthStatus.database ? '✅' : '❌'}
          </div>
        )}
        
        {/* Full-width banner */}
        <div className="w-full px-3 md:px-4 pt-8 md:pt-12 pb-4 md:pb-6 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg overflow-hidden">
              <ImageUpload
                currentImage={bannerImage}
                onImageChange={() => {}} // Read-only mode
                disabled={true}
              />
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 pt-2 md:pt-4 pb-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-3 md:px-4">
            <ErrorBoundary>
              <DashboardHeader 
                userEmail={user?.email}
                userName={userName}
                totalAnimals={totalAnimals}
                onForceRefresh={handleForceRefresh}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <DashboardStats 
                totalAnimals={totalAnimals}
                speciesCounts={speciesCounts}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <DashboardQuickActions />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <DashboardSupportInfo />
            </ErrorBoundary>

            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && healthStatus && (
              <Card className="mt-4 p-4 bg-muted">
                <CardContent>
                  <h3 className="font-semibold mb-2">Debug Info</h3>
                  <pre className="text-xs">{JSON.stringify(healthStatus, null, 2)}</pre>
                  <pre className="text-xs mt-2">Stats: {JSON.stringify(dashboardStats, null, 2)}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
