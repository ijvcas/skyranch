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
  
  // State for animals data - bypass React Query completely
  const [dashboardStats, setDashboardStats] = useState<{species_counts: Record<string, number>, total_count: number}>({
    species_counts: {},
    total_count: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Direct function to fetch animals - no React Query
  const fetchAnimalsDirectly = async () => {
    console.log('🔍 DIRECT: Fetching animals directly...');
    console.log('👤 DIRECT: Current user:', user);
    console.log('🆔 DIRECT: User ID:', user?.id);
    
    if (!user?.id) {
      console.log('❌ DIRECT: No user ID available');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 DIRECT: Querying animals table for user:', user.id);
      const { data: animals, error } = await supabase
        .from('animals')
        .select('species, id, name, lifecycle_status')
        .eq('user_id', user.id);

      console.log('📊 DIRECT: Raw query result:', { animals, error, count: animals?.length });
      
      if (error) {
        console.error('❌ DIRECT: Query error:', error);
        setDashboardStats({ species_counts: {}, total_count: 0 });
        return;
      }

      if (!animals || animals.length === 0) {
        console.log('📊 DIRECT: No animals found');
        setDashboardStats({ species_counts: {}, total_count: 0 });
        return;
      }

      console.log('📊 DIRECT: All animals:', animals.map(a => ({ 
        id: a.id, 
        name: a.name, 
        species: a.species, 
        lifecycle_status: a.lifecycle_status 
      })));

      // Filter active animals
      const activeAnimals = animals.filter(animal => animal.lifecycle_status !== 'deceased');
      console.log('📊 DIRECT: Active animals:', activeAnimals.length, 'Total:', animals.length);

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

      console.log('✅ DIRECT: Final result:', result);
      setDashboardStats(result);

    } catch (error) {
      console.error('❌ DIRECT: Exception:', error);
      setDashboardStats({ species_counts: {}, total_count: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Load animals on component mount
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 DIRECT: Component mounted, fetching animals...');
      fetchAnimalsDirectly();
    }
  }, [user?.id]);

  // Simple force refresh that calls our direct function
  const handleForceRefresh = async () => {
    console.log('🔄 DIRECT: Force refresh clicked!');
    
    await fetchAnimalsDirectly();
    
    toast({
      title: "Actualizado",
      description: "Dashboard actualizado - revisa la consola para ver los datos.",
    });
  };

  // Define refetch as alias to fetchAnimalsDirectly for compatibility
  const refetch = fetchAnimalsDirectly;

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
