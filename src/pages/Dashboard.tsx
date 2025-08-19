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
  
  // Direct animals query - bypass the problematic RPC function completely
  const { data: dashboardStats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'animals-direct'],
    queryFn: async () => {
      console.log('🔍 Fetching animals directly from table...');
      
      if (!user?.id) {
        console.log('❌ No user ID available');
        return { species_counts: {}, total_count: 0 };
      }

      try {
        // Direct query to animals table - no RPC function
        const { data: animals, error } = await supabase
          .from('animals')
          .select('species')
          .eq('user_id', user.id)
          .neq('lifecycle_status', 'deceased');

        if (error) {
          console.error('❌ Direct animals query error:', error);
          return { species_counts: {}, total_count: 0 };
        }

        if (!animals || animals.length === 0) {
          console.log('📊 No animals found for user');
          return { species_counts: {}, total_count: 0 };
        }

        // Calculate species counts
        const speciesCounts = animals.reduce((acc: Record<string, number>, animal) => {
          const species = animal.species || 'Sin especificar';
          acc[species] = (acc[species] || 0) + 1;
          return acc;
        }, {});

        const result = {
          species_counts: speciesCounts,
          total_count: animals.length
        };

        console.log('✅ Animals fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching animals:', error);
        return { species_counts: {}, total_count: 0 };
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    gcTime: 300000,
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Simple force refresh that works
  const handleForceRefresh = async () => {
    console.log('🔄 Force refreshing dashboard...');
    
    // Clear React Query cache and refetch
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['app-users'] });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    
    await refetch();
    
    toast({
      title: "Actualizado",
      description: "Dashboard actualizado correctamente.",
    });
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

  // Dashboard always loads immediately - no blocking on data
  // Show loading only for authentication, not for data


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
