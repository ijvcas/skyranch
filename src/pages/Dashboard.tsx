import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/services/userService';
import { dashboardBannerService } from '@/services/dashboardBannerService';
import { networkDiagnostics } from '@/utils/networkDiagnostics';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';
import DashboardSupportInfo from '@/components/dashboard/DashboardSupportInfo';
import SecureErrorBoundary from '@/components/common/SecureErrorBoundary';
import { applySEO, injectJSONLD } from '@/utils/seo';


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
  
  // Load banner image and user data
  useEffect(() => {
    // Run network diagnostics on component mount
    networkDiagnostics.runDiagnostics().then(({ network, supabase }) => {
      if (!network) {
        console.error('🔴 Network connectivity issues detected');
        toast({
          title: "Problema de Conexión",
          description: "Se detectaron problemas de conectividad de red",
          variant: "destructive"
        });
      }
      if (!supabase) {
        console.error('🔴 Supabase connectivity issues detected');
        toast({
          title: "Problema de Base de Datos",
          description: "No se puede conectar a la base de datos",
          variant: "destructive"
        });
      }
    });
    
    const loadBanner = async () => {
      try {
        const bannerData = await dashboardBannerService.getBanner();
        if (bannerData?.image_url) {
          setBannerImage(bannerData.image_url);
        }
      } catch (error) {
        console.error('Error loading banner:', error);
        // Keep default fallback image
      }
    };
    
    const loadUserData = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData?.name) {
          setUserName(userData.name);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to email if name not available
      }
    };
    
    loadBanner();
    loadUserData();
  }, [toast]);
  
  // Simplified dashboard stats with timeout and fallback
  const { data: dashboardStats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'animal-stats'],
    queryFn: async () => {
      console.log('🔍 Starting dashboard stats fetch...');
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return { species_counts: {}, total_count: 0 };
      }
      
      console.log('👤 Auth user:', user.email);
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Dashboard stats timeout')), 8000)
        );
        
        const statsPromise = supabase.rpc('get_dashboard_animal_stats');
        
        const result = await Promise.race([statsPromise, timeoutPromise]);
        
        if (result.error) {
          console.error('❌ RPC Error:', result.error);
          return { species_counts: {}, total_count: 0 };
        }
        
        console.log('✅ Dashboard stats fetched successfully:', result.data);
        return result.data?.[0] || { species_counts: {}, total_count: 0 };
      } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        // Return empty data instead of throwing
        return { species_counts: {}, total_count: 0 };
      }
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 300000,
    retry: 1,
    retryDelay: 2000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Force a complete refresh of all data with user sync retry
  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing all data with user sync...');
    
    try {
      // Clear cache and run diagnostics
      networkDiagnostics.clearCache();
      networkDiagnostics.runDiagnostics();
      
      // Force user sync retry
      console.log('🔄 Forcing user sync retry...');
      const { syncAuthUsersToAppUsers } = await import('@/services/user/userQueries');
      await syncAuthUsersToAppUsers();
      console.log('✅ User sync completed');
      
      // Clear React Query cache and refetch
      queryClient.clear();
      await refetch();
      
      toast({
        title: "Datos actualizados",
        description: "Se han recargado todos los datos del sistema.",
      });
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      toast({
        title: "Error al actualizar",
        description: "Hubo un problema al recargar los datos. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

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

  // Show loading only for short time, then show with empty data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Cargando dashboard...</div>
          <div className="text-sm text-muted-foreground mt-2">Usuario: {user?.email}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-sm text-primary hover:underline"
          >
            Recargar si tarda mucho
          </button>
        </div>
      </div>
    );
  }


  return (
    <SecureErrorBoundary component="Dashboard" onError={(error) => console.error('Dashboard Error:', error)}>
      <div className="min-h-screen">
        {/* Full-width banner without white frame and more top spacing */}
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
            <SecureErrorBoundary component="DashboardHeader">
              <DashboardHeader 
                userEmail={user?.email}
                userName={userName}
                totalAnimals={totalAnimals}
                onForceRefresh={handleForceRefresh}
              />
            </SecureErrorBoundary>

            <SecureErrorBoundary component="DashboardStats">
              <DashboardStats 
                totalAnimals={totalAnimals}
                speciesCounts={speciesCounts}
              />
            </SecureErrorBoundary>

            <SecureErrorBoundary component="DashboardQuickActions">
              <DashboardQuickActions />
            </SecureErrorBoundary>
            
            <SecureErrorBoundary component="DashboardSupportInfo">
              <DashboardSupportInfo />
            </SecureErrorBoundary>
          </div>
        </div>
      </div>
    </SecureErrorBoundary>
  );
};

export default Dashboard;
