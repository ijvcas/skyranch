
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Star, Filter, Calendar, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { UniversalBreedingAnalysisService } from '@/services/universal-breeding';
import type { UniversalBreedingRecommendation } from '@/services/universal-breeding/types';
import { getStatusColor, getStatusText } from '@/utils/animalStatus';

const BreedingRecommendationsCard: React.FC = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('ALL_SPECIES');
  const [minCompatibility, setMinCompatibility] = useState<number>(40);
  const [sortBy, setSortBy] = useState<'compatibility' | 'species' | 'genetic'>('compatibility');

  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ['universal-breeding-recommendations'],
    queryFn: () => UniversalBreedingAnalysisService.generateUniversalBreedingRecommendations(),
  });

  const { data: breedingPairs } = useQuery({
    queryKey: ['breeding-pairs-for-recommendations'],
    queryFn: () => UniversalBreedingAnalysisService.getBreedingPairsBySpecies(),
  });

  // Get available species from recommendations
  const availableSpecies = recommendations ? 
    [...new Set(recommendations.map(r => r.species))] : [];

  // Filter and sort recommendations
  const filteredRecommendations = recommendations
    .filter(rec => {
      const speciesMatch = selectedSpecies === 'ALL_SPECIES' || rec.species === selectedSpecies;
      const compatibilityMatch = rec.compatibilityScore >= minCompatibility;
      return speciesMatch && compatibilityMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'compatibility':
          return b.compatibilityScore - a.compatibilityScore;
        case 'species':
          return a.species.localeCompare(b.species);
        case 'genetic':
          const aGeneticScore = parseFloat(a.geneticBenefits[0]?.split(': ')[1] || '0');
          const bGeneticScore = parseFloat(b.geneticBenefits[0]?.split(': ')[1] || '0');
          return bGeneticScore - aGeneticScore;
        default:
          return 0;
      }
    });

  // Group recommendations by species
  const groupedRecommendations = filteredRecommendations.reduce((groups, rec) => {
    if (!groups[rec.species]) {
      groups[rec.species] = [];
    }
    groups[rec.species].push(rec);
    return groups;
  }, {} as Record<string, UniversalBreedingRecommendation[]>);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCompatibilityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAnimalHealthStatus = (animalName: string) => {
    if (!breedingPairs) return null;
    
    const allAnimals = [...breedingPairs.males, ...breedingPairs.females];
    const animal = allAnimals.find(a => a.name === animalName);
    
    // Check if animal is deceased first
    if (animal?.lifecycleStatus === 'deceased') {
      return 'deceased';
    }
    
    return animal?.healthStatus || 'healthy';
  };

  const getPlanningBadge = (animalName: string) => {
    const healthStatus = getAnimalHealthStatus(animalName);
    
    if (healthStatus === 'deceased') {
      return <Badge className="bg-red-100 text-red-800">⚠️ Animal Fallecido</Badge>;
    }
    if (healthStatus === 'pregnant') {
      return <Badge className="bg-purple-100 text-purple-800">Planificar post-parto</Badge>;
    }
    if (healthStatus === 'sick' || healthStatus === 'treatment') {
      return <Badge className="bg-orange-100 text-orange-800">Planificar post-recuperación</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Recomendaciones de Apareamiento por Especie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-gray-500">Generando recomendaciones de apareamiento...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Recomendaciones de Apareamiento por Especie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay suficientes animales
            </h3>
            <p className="text-gray-500">
              Necesitas al menos un macho y una hembra por especie para generar recomendaciones.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Recomendaciones de Apareamiento por Especie
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 mt-4 sm:grid sm:grid-cols-1 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filtrar por especie</label>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_SPECIES">Todas las especies</SelectItem>
                {availableSpecies.map((species) => (
                  <SelectItem key={species} value={species}>
                    {species} ({groupedRecommendations[species]?.length || 0} recomendaciones)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Compatibilidad mínima</label>
            <Select value={minCompatibility.toString()} onValueChange={(value) => setMinCompatibility(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todas (0%+)</SelectItem>
                <SelectItem value="40">Aceptable (40%+)</SelectItem>
                <SelectItem value="60">Buena (60%+)</SelectItem>
                <SelectItem value="80">Excelente (80%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ordenar por</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'compatibility' | 'species' | 'genetic')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compatibility">Compatibilidad</SelectItem>
                <SelectItem value="species">Especie</SelectItem>
                <SelectItem value="genetic">Diversidad Genética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {selectedSpecies === 'ALL_SPECIES' ? (
            // Show grouped by species
            Object.entries(groupedRecommendations).map(([species, speciesRecs]) => (
              <div key={species} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {species}
                  </h3>
                  <Badge variant="outline" className="bg-blue-50">
                    {speciesRecs.length} recomendaciones
                  </Badge>
                </div>
                
                <div className="grid gap-4">
                  {speciesRecs.slice(0, 5).map((recommendation, index) => (
                    <RecommendationCard 
                      key={recommendation.pairId} 
                      recommendation={recommendation} 
                      index={index}
                      getCompatibilityColor={getCompatibilityColor}
                      getCompatibilityBadgeColor={getCompatibilityBadgeColor}
                      getAnimalHealthStatus={getAnimalHealthStatus}
                      getPlanningBadge={getPlanningBadge}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Show filtered species
            <div className="grid gap-4">
              {filteredRecommendations.slice(0, 10).map((recommendation, index) => (
                <RecommendationCard 
                  key={recommendation.pairId} 
                  recommendation={recommendation} 
                  index={index}
                  getCompatibilityColor={getCompatibilityColor}
                  getCompatibilityBadgeColor={getCompatibilityBadgeColor}
                  getAnimalHealthStatus={getAnimalHealthStatus}
                  getPlanningBadge={getPlanningBadge}
                />
              ))}
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Button 
              onClick={() => refetch()}
              variant="outline"
              className="w-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recalcular Recomendaciones
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecommendationCardProps {
  recommendation: UniversalBreedingRecommendation;
  index: number;
  getCompatibilityColor: (score: number) => string;
  getCompatibilityBadgeColor: (score: number) => string;
  getAnimalHealthStatus: (animalName: string) => string;
  getPlanningBadge: (animalName: string) => React.ReactNode;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  index,
  getCompatibilityColor,
  getCompatibilityBadgeColor,
  getAnimalHealthStatus,
  getPlanningBadge
}) => {
  const maleHealthStatus = getAnimalHealthStatus(recommendation.maleName);
  const femaleHealthStatus = getAnimalHealthStatus(recommendation.femaleName);

  return (
    <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-lg">
            {recommendation.maleName} × {recommendation.femaleName}
          </h4>
          <div className="flex flex-col gap-2 mt-1 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-1">
              <div 
                className={`w-3 h-3 rounded-full ${getCompatibilityColor(recommendation.compatibilityScore)}`}
              />
              <span className="text-sm font-medium">
                {recommendation.compatibilityScore}% compatibilidad
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge className={getCompatibilityBadgeColor(recommendation.compatibilityScore)}>
                {recommendation.compatibilityScore >= 80 ? 'Excelente' : 
                 recommendation.compatibilityScore >= 60 ? 'Buena' : 'Moderada'}
              </Badge>
              {index === 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="w-3 h-3 mr-1" />
                  Top Recomendación
                </Badge>
              )}
              {recommendation.isSpecialBreed && (
                <Badge className="bg-purple-100 text-purple-800">
                  Raza Especial
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animal Health Status */}
      <div className="flex flex-col gap-2 mb-3 sm:grid sm:grid-cols-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">♂ {recommendation.maleName}:</span>
          <Badge className={getStatusColor(maleHealthStatus)}>
            {getStatusText(maleHealthStatus)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">♀ {recommendation.femaleName}:</span>
          <Badge className={getStatusColor(femaleHealthStatus)}>
            {getStatusText(femaleHealthStatus)}
          </Badge>
        </div>
      </div>

      {/* Planning Badges */}
      <div className="flex gap-2 mb-3">
        {getPlanningBadge(recommendation.maleName)}
        {getPlanningBadge(recommendation.femaleName)}
      </div>

      {/* Key Information */}
      <div className="flex flex-col gap-2 text-sm mb-3 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Época:</span>
          <span className="font-medium">{recommendation.breedingWindow}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Gestación:</span>
          <span className="font-medium">{recommendation.gestationDays} días</span>
        </div>
        {recommendation.breed && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Raza:</span>
            <span className="font-medium">{recommendation.breed}</span>
          </div>
        )}
      </div>

      {/* Genetic Benefits */}
      <div className="mb-3">
        <h5 className="text-sm font-medium text-gray-700 mb-1">Beneficios Genéticos:</h5>
        <div className="flex flex-wrap gap-1">
          {recommendation.geneticBenefits.map((benefit, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {benefit}
            </Badge>
          ))}
        </div>
      </div>

      {/* Considerations */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-1">Consideraciones:</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          {recommendation.considerations.slice(0, 2).map((consideration, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{consideration}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BreedingRecommendationsCard;
