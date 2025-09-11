
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  totalAnimals: number;
  speciesCounts: Record<string, number>;
}

const DashboardStats = ({ totalAnimals, speciesCounts }: DashboardStatsProps) => {
  const navigate = useNavigate();

  const handleTotalAnimalsClick = () => {
    navigate('/animals');
  };

  const handleSpeciesClick = (species: string) => {
    navigate(`/animals?species=${species}&expand=true`);
  };

  const getSpeciesDisplayName = (species: string) => {
    const speciesMap = {
      'bovino': 'Bovinos',
      'ovino': 'Ovinos', 
      'equino': 'Equinos',
      'caprino': 'Caprinos',
      'porcino': 'Porcinos',
      'aviar': 'Aves',
      'canino': 'Caninos'
    };
    return speciesMap[species as keyof typeof speciesMap] || species.charAt(0).toUpperCase() + species.slice(1);
  };

  const getSpeciesColor = (species: string) => {
    const colorMap = {
      'equino': 'bg-gradient-to-br from-blue-500 to-blue-600',
      'bovino': 'bg-gradient-to-br from-yellow-500 to-orange-500',
      'ovino': 'bg-gradient-to-br from-purple-500 to-purple-600',
      'caprino': 'bg-gradient-to-br from-red-500 to-red-600',
      'porcino': 'bg-gradient-to-br from-pink-500 to-pink-600',
      'aviar': 'bg-gradient-to-br from-orange-500 to-orange-600',
      'canino': 'bg-gradient-to-br from-indigo-500 to-indigo-600'
    };
    return colorMap[species as keyof typeof colorMap] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {/* Total Animals Card */}
      <Card 
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={handleTotalAnimalsClick}
      >
        <CardHeader className="pb-2 p-3 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-blue-700 uppercase tracking-wide">
            Total Animales
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-3 md:p-6">
          <div className="text-xl md:text-3xl font-bold text-blue-900 mb-1">
            {totalAnimals.toLocaleString()}
          </div>
          <p className="text-xs md:text-sm text-blue-600">animales registrados</p>
        </CardContent>
      </Card>

      {/* Species Cards */}
      {Object.entries(speciesCounts).map(([species, count]) => (
        <Card 
          key={species} 
          className={`${getSpeciesColor(species)} shadow-lg border-opacity-20 hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-105`}
          onClick={() => handleSpeciesClick(species)}
        >
          <CardHeader className="pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-white uppercase tracking-wide opacity-90">
              {getSpeciesDisplayName(species)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 md:p-6">
            <div className="text-xl md:text-3xl font-bold text-white mb-1">
              {count}
            </div>
            <p className="text-xs md:text-sm text-white opacity-80">
              {count === 1 ? 'animal' : 'animales'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
