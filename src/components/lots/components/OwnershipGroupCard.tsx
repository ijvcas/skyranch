import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type OwnershipGroup } from '@/services/ownerAnalysisService';
import { Building2, MapPin, Euro, Users, Check } from 'lucide-react';

interface OwnershipGroupCardProps {
  group: OwnershipGroup;
  isSelected: boolean;
  onClick: () => void;
}

const OwnershipGroupCard: React.FC<OwnershipGroupCardProps> = ({
  group,
  isSelected,
  onClick
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatArea = (hectares: number) => {
    return `${hectares.toFixed(2)} ha`;
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: group.color }}
              />
              {group.representativeName}
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </CardTitle>
            {group.matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {group.matchReasons.map((reason, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant={group.totalParcels > 3 ? 'default' : 'secondary'}>
            {group.totalParcels} {group.totalParcels === 1 ? 'parcela' : 'parcelas'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Registros</p>
              <p className="text-sm font-semibold">{group.owners.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Área Total</p>
              <p className="text-sm font-semibold">{formatArea(group.totalArea)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-sm font-semibold">
                {group.totalValue > 0 ? formatCurrency(group.totalValue) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Confianza</p>
              <p className="text-sm font-semibold">{group.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Owner Details */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Propietarios asociados:</p>
          <div className="flex flex-wrap gap-2">
            {group.owners.slice(0, 5).map((owner, idx) => (
              <Badge key={owner.id} variant="outline" className="text-xs">
                {owner.owner_name}
                {owner.ownership_percentage < 100 && (
                  <span className="ml-1 text-muted-foreground">
                    ({owner.ownership_percentage}%)
                  </span>
                )}
              </Badge>
            ))}
            {group.owners.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{group.owners.length - 5} más
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info if available */}
        {group.owners[0].contact_email && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Email:</span> {group.owners[0].contact_email}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OwnershipGroupCard;
