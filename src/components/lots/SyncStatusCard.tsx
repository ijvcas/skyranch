
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap, AlertCircle } from 'lucide-react';

interface SyncStatusCardProps {
  propiedadParcelsCount: number;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  propiedadParcelsCount
}) => {
  const canSync = propiedadParcelsCount > 0;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-3 md:space-y-0">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Parcelas PROPIEDAD:</span>
              <Badge variant={propiedadParcelsCount > 0 ? "default" : "secondary"}>
                {propiedadParcelsCount}
              </Badge>
            </div>
          </div>
          
          {!canSync && (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Configure parcelas PROPIEDAD primero</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatusCard;
