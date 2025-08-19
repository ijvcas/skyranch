import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WeatherWidget from '@/components/weather/WeatherWidget';
import DashboardBanner from '@/components/dashboard/DashboardBanner';
// import DashboardGreeting from '@/components/dashboard/DashboardGreeting';
import { getAnimalsData, getDashboardStats } from '@/services/coreDataService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAnimals: 0,
    activeAnimals: 0,
    totalLots: 0,
    activeLots: 0,
    recentEvents: 0,
    speciesBreakdown: {}
  });
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 DASHBOARD: Loading data...');
      
      const [dashboardStats, animalsData] = await Promise.all([
        getDashboardStats(),
        getAnimalsData()
      ]);

      setStats(dashboardStats);
      setAnimals(animalsData);
      
      console.log('✅ DASHBOARD: Data loaded successfully');
    } catch (error) {
      console.error('❌ DASHBOARD: Error loading data:', error);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleForceRefresh = () => {
    console.log('🔄 DASHBOARD: Force refresh triggered!');
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="page-with-logo">
        <DashboardBanner />
        <div className="container mx-auto py-6">
          <div className="text-center">Cargando datos del dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-with-logo">
      <DashboardBanner />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* <DashboardGreeting /> */}
        
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive">{error}</div>
              <Button onClick={handleForceRefresh} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAnimals}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeAnimals} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lotes</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLots}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeLots} disponibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recentEvents}</div>
                  <p className="text-xs text-muted-foreground">próximos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12%</div>
                  <p className="text-xs text-muted-foreground">vs. mes anterior</p>
                </CardContent>
              </Card>
            </div>

            {/* Species Breakdown */}
            {Object.keys(stats.speciesBreakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Especies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.speciesBreakdown).map(([species, count]) => (
                      <Badge key={species} variant="secondary">
                        {species}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Animals Message */}
            {animals.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-lg text-primary">
                      No se encontraron animales. Si deberías ver animales, usa el botón "Forzar Actualización".
                    </div>
                    <Button onClick={handleForceRefresh} className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Forzar Actualización
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Reporte de Campo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                      📋 Reporte de Campo +
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Refresh Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button onClick={handleForceRefresh} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
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