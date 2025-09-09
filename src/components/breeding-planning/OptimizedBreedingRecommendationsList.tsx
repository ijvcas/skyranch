import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useOptimizedBreedingRecommendations, useClearBreedingCache } from '@/hooks/useOptimizedBreedingRecommendations';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouch } from '@/hooks/use-touch';
import { BlockedPairingAlert } from './BlockedPairingAlert';

// Skeleton loader component
const RecommendationSkeleton = memo(() => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
    <div className="space-y-1">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="mt-2">
      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
));

RecommendationSkeleton.displayName = 'RecommendationSkeleton';

// Individual recommendation item component
const RecommendationItem = memo(({ recommendation, index }: { 
  recommendation: any, 
  index: number 
}) => {
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouch();

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskColor = (riskLevel: 'low' | 'moderate' | 'high') => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="border rounded-lg p-4 mobile-tap-target touch-manipulation animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm md:text-base">
            {recommendation.maleName} × {recommendation.femaleName}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <div 
                className={`w-3 h-3 rounded-full ${getCompatibilityColor(recommendation.compatibilityScore)}`}
              />
              <span className="text-xs md:text-sm font-medium">
                {recommendation.compatibilityScore}% compatibilidad
              </span>
            </div>
            <Badge className={`text-xs ${getRiskColor(recommendation.inbreedingRisk)}`}>
              {recommendation.inbreedingRisk === 'low' ? 'Bajo riesgo' : 
               recommendation.inbreedingRisk === 'moderate' ? 'Riesgo moderado' : 'Alto riesgo'}
            </Badge>
            {index === 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Recomendado
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs md:text-sm space-y-1">
        {recommendation.recommendations.slice(0, 2).map((rec: string, recIndex: number) => (
          <div key={recIndex} className="text-gray-600">{rec}</div>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Ganancia de diversidad genética: {recommendation.geneticDiversityGain}%
      </div>
    </div>
  );
});

RecommendationItem.displayName = 'RecommendationItem';

// Main component
const OptimizedBreedingRecommendationsList: React.FC = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const clearCache = useClearBreedingCache();
  const [blockedPairings, setBlockedPairings] = useState<Array<{
    maleName: string;
    femaleName: string;
    reason: string;
  }>>([]);
  
  console.log('🔧 DEBUG: OptimizedBreedingRecommendationsList component mounted');
  
  const { 
    data: breedingRecommendations = [], 
    isLoading, 
    isError,
    refetch,
    isRefetching 
  } = useOptimizedBreedingRecommendations();
  
  console.log('🔧 DEBUG: Hook results:', { 
    recommendationsLength: breedingRecommendations.length, 
    isLoading, 
    isError, 
    isRefetching 
  });

  const handleRefresh = async () => {
    clearCache();
    await queryClient.invalidateQueries({ queryKey: ['breeding-recommendations'] });
    refetch();
  };

  if (isError) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
            Recomendaciones de Apareamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Heart className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              Error al cargar recomendaciones
            </h3>
            <p className="text-sm md:text-base text-gray-500 mb-4">
              Ocurrió un problema al generar las recomendaciones de apareamiento.
            </p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="mobile-tap-target"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            Recomendaciones de Apareamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: isMobile ? 3 : 5 }, (_, i) => (
              <RecommendationSkeleton key={i} />
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              {isMobile ? 'Análisis genético optimizado para móvil' : 'Generando recomendaciones basadas en análisis genético'}...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (breedingRecommendations.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
            Recomendaciones de Apareamiento por Especie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 md:py-8">
            <Heart className="w-8 h-8 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              No hay animales suficientes para apareamiento
            </h3>
            <p className="text-sm md:text-base text-gray-500 mb-4">
              Para generar recomendaciones necesitas:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mb-4">
              <li>• Al menos un macho y una hembra</li>
              <li>• Animales con estado de salud registrado</li>
              <li>• Género definido correctamente (macho/hembra)</li>
            </ul>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="mobile-tap-target"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Animales
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limit displayed recommendations on mobile for better performance
  const displayLimit = isMobile ? 5 : 10;
  const displayedRecommendations = breedingRecommendations.slice(0, displayLimit);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Heart className="w-4 h-4 md:w-5 md:h-5" />
          Recomendaciones de Apareamiento por Especie
          {isMobile && (
            <Badge variant="secondary" className="text-xs">
              Móvil
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Show blocked pairings alerts if any */}
        {blockedPairings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Apareamientos Bloqueados ({blockedPairings.length})
            </h4>
            {blockedPairings.map((blocked, index) => (
              <BlockedPairingAlert
                key={index}
                maleName={blocked.maleName}
                femaleName={blocked.femaleName}
                reason={blocked.reason}
                onDismiss={() => {
                  setBlockedPairings(prev => prev.filter((_, i) => i !== index));
                }}
              />
            ))}
          </div>
        )}
        
        <div className="space-y-3 md:space-y-4">
          {displayedRecommendations.map((recommendation, index) => (
            <RecommendationItem
              key={recommendation.id}
              recommendation={recommendation}
              index={index}
            />
          ))}
          
          {breedingRecommendations.length > displayLimit && (
            <div className="text-center text-sm text-gray-500 pt-2">
              Mostrando {displayLimit} de {breedingRecommendations.length} recomendaciones
            </div>
          )}
          
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="w-full mt-4 mobile-tap-target touch-manipulation"
            disabled={isRefetching}
          >
            {isRefetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recalculando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recalcular Recomendaciones
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(OptimizedBreedingRecommendationsList);