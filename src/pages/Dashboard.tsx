
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllAnimals } from '@/services/animalService';
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
import WeatherWidget from '@/components/weather/WeatherWidget';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bannerImage, setBannerImage] = useState<string>('/lovable-uploads/d3c33c19-f7cd-441e-884f-371ed6481179.png');
  const [userName, setUserName] = useState<string>('');
  
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
  
  // Enhanced query with better error handling and permission checking
  const { data: allAnimals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['animals', 'all-users'],
    queryFn: async () => {
      try {
        console.log('🔍 Checking animals_view permission before fetching...');
        
        // Check permission before fetching data
        try {
          await checkPermission('animals_view');
          console.log('✅ Permission granted for animals_view');
        } catch (permissionError) {
          console.log('❌ Permission denied for animals_view:', permissionError);
          // Return empty array instead of throwing to prevent app crash
          return [];
        }
        
        console.log('🔄 Fetching animals data...');
        const animals = await getAllAnimals();
        console.log('✅ Animals fetched successfully:', animals.length);
        return animals;
      } catch (error) {
        console.error('❌ Error fetching animals:', error);
        // Return empty array instead of throwing to prevent app crash
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

  // Force a complete refresh of all data
  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing all data...');
    
    // Clear cache and run diagnostics
    networkDiagnostics.clearCache();
    networkDiagnostics.runDiagnostics();
    
    queryClient.clear();
    refetch();
    toast({
      title: "Actualizando datos",
      description: "Recargando todos los animales del sistema...",
    });
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
      {/* Full-width banner matching System Settings layout */}
      <div className="w-full px-3 md:px-4 py-4 md:py-6 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-3 md:p-4">
              <ImageUpload
                currentImage={bannerImage}
                onImageChange={() => {}} // Read-only mode
                disabled={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 pt-6 md:pt-8 pb-20 min-h-screen">
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
