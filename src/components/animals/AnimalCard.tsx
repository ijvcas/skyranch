import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Tag, Calendar, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Animal {
  id: string;
  name: string;
  tag?: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  weight?: string;
  color?: string;
  healthStatus?: string;
  notes?: string;
  image?: string | null;
  lifecycleStatus?: string;
  current_lot_id?: string;
}

interface AnimalCardProps {
  animal: Animal;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal }) => {
  const navigate = useNavigate();

  const getHealthStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'sick':
        return 'bg-red-500';
      case 'injured':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'Saludable';
      case 'sick':
        return 'Enfermo';
      case 'injured':
        return 'Herido';
      default:
        return 'Desconocido';
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Edad desconocida';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} ${years === 1 ? 'año' : 'años'}${remainingMonths > 0 ? ` ${remainingMonths}m` : ''}`;
    }
  };

  const handleViewDetails = () => {
    navigate(`/animal/${animal.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{animal.name}</CardTitle>
              {animal.tag && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3" />
                  {animal.tag}
                </CardDescription>
              )}
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getHealthStatusColor(animal.healthStatus)} text-white`}
          >
            {getHealthStatusText(animal.healthStatus)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Animal Image */}
        {animal.image && (
          <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
            <img 
              src={animal.image} 
              alt={`Foto de ${animal.name}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Especie:</span>
            <p className="font-medium capitalize">{animal.species}</p>
          </div>
          {animal.breed && (
            <div>
              <span className="text-muted-foreground">Raza:</span>
              <p className="font-medium">{animal.breed}</p>
            </div>
          )}
          {animal.gender && (
            <div>
              <span className="text-muted-foreground">Sexo:</span>
              <p className="font-medium capitalize">{animal.gender}</p>
            </div>
          )}
          {animal.weight && (
            <div>
              <span className="text-muted-foreground">Peso:</span>
              <p className="font-medium">{animal.weight} kg</p>
            </div>
          )}
        </div>

        {/* Age */}
        {animal.birthDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{calculateAge(animal.birthDate)}</span>
          </div>
        )}

        {/* Location */}
        {animal.current_lot_id && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>En lote asignado</span>
          </div>
        )}

        {/* Color */}
        {animal.color && (
          <div className="text-sm">
            <span className="text-muted-foreground">Color: </span>
            <span className="font-medium">{animal.color}</span>
          </div>
        )}

        {/* Notes preview */}
        {animal.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Notas: </span>
            <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
              {animal.notes.length > 50 
                ? `${animal.notes.substring(0, 50)}...` 
                : animal.notes}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnimalCard;