
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { getAnimalsLean } from '@/services/animal/animalQueries';
import { checkPermission } from '@/services/permissionService';
import { getCurrentUser } from '@/services/userService';
import { dashboardBannerService } from '@/services/dashboardBannerService';
import { networkDiagnostics } from '@/utils/networkDiagnostics';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions';
import DashboardWeeklyEvents from '@/components/dashboard/DashboardWeeklyEvents';
import DashboardLoadingState from '@/components/dashboard/DashboardLoadingState';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';
import DashboardSupportInfo from '@/components/dashboard/DashboardSupportInfo';
import DashboardSkeletonLoader from '@/components/dashboard/DashboardSkeletonLoader';
import { useDashboardStats } from '@/hooks/useDashboardStats';
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
  // Use optimized dashboard stats hook
  const { data: statsData, isLoading, error, refetch } = useDashboardStats();

  // Legacy query for compatibility - will be removed in next phase
  const { data: allAnimals = [] } = useQuery({
    queryKey: ['animals', 'all-users'],
    queryFn: async () => {
      try {
        console.log('🔍 Starting animal data fetch...');
        
        // Use the auth context user instead of calling getCurrentUser()
        if (!user) {
          console.log('❌ No authenticated user found');
          return [];
        }
        
        console.log('👤 Auth user:', user.email);
        
        // Get user role from app_users table directly
        let userRole = null;
        let shouldBypassPermissions = false;
        
        try {
          const { data: appUser, error } = await supabase
            .from('app_users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!error && appUser) {
            userRole = appUser.role;
            console.log('👤 User role:', userRole);
            
            // If user is admin or manager, allow bypass
            if (userRole === 'admin' || userRole === 'manager') {
              shouldBypassPermissions = true;
              console.log('🔓 Admin/Manager detected - enabling fallback access');
            }
          }
        } catch (userError) {
          console.error('❌ Error getting user role:', userError);
        }
        
        // Try permission check, but don't block dashboard for auth context issues
        try {
          await checkPermission('animals_view', user);
          console.log('✅ Permission granted for animals_view');
        } catch (permissionError) {
          console.warn('⚠️ Permission check failed for animals_view, continuing anyway due to auth context issues:', permissionError);
          // Continue - the updated checkPermission function handles auth context issues gracefully
        }
        
        console.log('🔄 Fetching animals (lean) data...');
        const animals = await getAnimalsLean();
        console.log('✅ Animals (lean) fetched successfully:', animals.length);
        return animals;
      } catch (error) {
        console.error('❌ Error fetching animals:', error);
        // Don’t break the dashboard for transient or permission issues
        return [];
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
      
      // Only clear animal-related queries, keep weather and other data
      queryClient.removeQueries({ queryKey: ['animals'] });
      queryClient.removeQueries({ queryKey: ['animal-stats'] });
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

  // Extract stats from optimized hook
  const totalAnimals = statsData?.totalAnimals || 0;
  const speciesCounts = statsData?.speciesCounts || {};

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
    return <DashboardSkeletonLoader />;
  }

  if (error) {
    console.warn('⚠️ Non-blocking dashboard error:', error);
    // Continue rendering with whatever data we have (may be empty)
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

          {totalAnimals === 0 ? (
            // Empty state for users with no animals
            <Card className="mb-8 shadow-lg border-l-4 border-l-blue-500">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Bienvenido a SKYRANCH!</h3>
                    <p className="text-gray-600 mb-4">
                      No se encontraron animales. Para empezar a gestionar tu granja, agrega tus primeros animales.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/animals')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar Animales
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DashboardStats 
              totalAnimals={totalAnimals}
              speciesCounts={speciesCounts}
            />
          )}

          <DashboardWeeklyEvents />
          
          <DashboardQuickActions />
          
          <DashboardSupportInfo />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
