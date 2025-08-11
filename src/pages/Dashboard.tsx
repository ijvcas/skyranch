
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animalService';
import { checkPermission } from '@/services/permissionService';
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
  
  // Enhanced query with admin fallback and better error handling
  const { data: allAnimals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['animals', 'all-users'],
    queryFn: async () => {
      try {
        console.log('🔍 Starting animal data fetch...');
        
        // First, try to get current user to check if they're admin
        let isAdmin = false;
        let shouldBypassPermissions = false;
        
        try {
          const currentUser = await getCurrentUser();
          console.log('👤 Current user:', currentUser?.email, 'Role:', currentUser?.role);
          isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
          
          // If user sync issues, allow admins and managers to bypass permission checks
          if (isAdmin) {
            shouldBypassPermissions = true;
            console.log('🔓 Admin/Manager detected - enabling fallback access');
          }
        } catch (userError) {
          console.error('❌ Error getting current user:', userError);
        }
        
        // Try permission check first, but have fallback for admins
        if (!shouldBypassPermissions) {
          try {
            await checkPermission('animals_view');
            console.log('✅ Permission granted for animals_view');
          } catch (permissionError) {
            console.error('❌ Permission denied for animals_view:', permissionError);
            throw new Error(`Acceso denegado: ${permissionError.message}`);
          }
        } else {
          console.log('🔓 Bypassing permission check for admin/manager');
        }
        
        console.log('🔄 Fetching animals (lean) data...');
        const animals = await getAnimalsLean();
        console.log('✅ Animals (lean) fetched successfully:', animals.length);
        return animals;
      } catch (error) {
        console.error('❌ Error fetching animals:', error);
        throw error; // Let error bubble up to trigger error state
      }
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Only retry up to 2 times for certain errors
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable to prevent excessive requests
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

  // Calculate all stats from the single query result
  const totalAnimals = allAnimals.length;
  const speciesCounts = allAnimals.reduce((counts, animal) => {
    counts[animal.species] = (counts[animal.species] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <DashboardLoadingState userEmail={user?.email} />;
  }

  if (error) {
    console.log('🔴 Dashboard error state triggered:', error);
    return (
      <DashboardErrorState 
        userEmail={user?.email}
        onForceRefresh={handleForceRefresh}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
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
          <DashboardHeader 
            userEmail={user?.email}
            userName={userName}
            totalAnimals={totalAnimals}
            onForceRefresh={handleForceRefresh}
          />

          <DashboardStats 
            totalAnimals={totalAnimals}
            speciesCounts={speciesCounts}
          />

          <DashboardQuickActions />
          
          
          <DashboardSupportInfo />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
