import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Heart, Calendar, Award, BarChart } from 'lucide-react';
import { RealBreedingAnalyticsService, type RealBreedingAnalytics } from '@/services/realBreedingAnalyticsService';

const BreedingAnalyticsCard = () => {
  const [analytics, setAnalytics] = useState<RealBreedingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await RealBreedingAnalyticsService.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading breeding analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análisis Universal de Reproducción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">Cargando análisis para todas las especies...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análisis Universal de Reproducción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">No se pudieron cargar los datos</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Análisis Universal de Reproducción Multi-Especies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.pregnancyRate}%
            </div>
            <div className="text-sm text-gray-600">Tasa de Embarazo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalBreedings}
            </div>
            <div className="text-sm text-gray-600">Total Cruces</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.avgGestationLength || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Días Gestación</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.upcomingBirths}
            </div>
            <div className="text-sm text-gray-600">Próximos Partos</div>
          </div>
        </div>

        {/* Multi-Species Data */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            🐾 Gestión Multi-Especies
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {analytics.donkeySpecificData.totalDonkeyBreedings}
              </div>
              <div className="text-xs text-gray-600">Total Apareamientos</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-600">
                {analytics.donkeySpecificData.lunaBreedings}
              </div>
              <div className="text-xs text-gray-600">Apareamientos LUNA</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {analytics.donkeySpecificData.lascauxBreedings}
              </div>
              <div className="text-xs text-gray-600">Apareamientos LASCAUX</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-xs text-gray-600 mt-1">
                Razas Especiales Activas
              </div>
            </div>
          </div>
          <div className="mt-3 p-2 bg-white rounded text-sm text-gray-700">
            {analytics.donkeySpecificData.frenchLineagePreservation}
          </div>
        </div>

        {/* Top Performing Females */}
        {analytics.topPerformingFemales.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Mejores Hembras Reproductoras
            </h4>
            <div className="space-y-2">
              {analytics.topPerformingFemales.slice(0, 3).map((female, index) => (
                <div key={female.animalId} className="flex justify-between items-center text-sm">
                  <span className="truncate">{female.animalName}</span>
                  <div className="flex gap-2">
                    <span className="text-pink-600 font-medium">{female.pregnancies} embarazos</span>
                    <span className="text-green-600">({female.successRate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breeding Status Distribution */}
        {analytics.breedingsByStatus.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Estado de Reproducciones
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              {analytics.breedingsByStatus.map((status, index) => (
                <div key={index}>
                  <div className="text-lg font-bold text-blue-600">
                    {status.count}
                  </div>
                  <div className="text-xs text-gray-600">{status.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Trends */}
        {analytics.seasonalTrends.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tendencias Estacionales
            </h4>
            <div className="space-y-1">
              {analytics.seasonalTrends.recommendations.map((recommendation, index) => (
                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Performance */}
        {analytics.breedingsByMonth.some(m => m.breedings > 0) && (
          <div>
            <h4 className="font-medium mb-2">Rendimiento Mensual</h4>
            <div className="grid grid-cols-6 gap-1 text-xs">
              {analytics.breedingsByMonth
                .filter(month => month.breedings > 0)
                .slice(0, 6)
                .map((month, index) => (
                <div key={index} className="text-center p-1 bg-blue-50 rounded">
                  <div className="font-medium">{month.month}</div>
                  <div className="text-gray-600">{month.pregnancies}/{month.breedings}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics.totalBreedings === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Registra apareamientos de cualquier especie para ver análisis detallados</p>
            <p className="text-sm mt-1">
              Sistema universal para todas las especies: equinos, ovinos, bovinos, caprinos y más
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BreedingAnalyticsCard;
