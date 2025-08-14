
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Minimize2, MapPin, Layers, Building, Leaf } from 'lucide-react';

interface MapLotLabelsControlProps {
  showLabels: boolean;
  onToggleLabels: (show: boolean) => void;
  showPropertyName: boolean;
  onTogglePropertyName: (show: boolean) => void;
  showPropertyLots: boolean;
  onTogglePropertyLots: (show: boolean) => void;
  showPastureLots: boolean;
  onTogglePastureLots: (show: boolean) => void;
}

const MapLotLabelsControl = ({
  showLabels,
  onToggleLabels,
  showPropertyName,
  onTogglePropertyName,
  showPropertyLots,
  onTogglePropertyLots,
  showPastureLots,
  onTogglePastureLots
}: MapLotLabelsControlProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);

  if (isMinimized) {
    return (
      <div className="absolute top-4 left-4 z-20">
        <Button
          onClick={() => setIsMinimized(false)}
          variant="outline"
          size="sm"
          className="bg-white/95 shadow-lg text-xs px-2 py-1"
        >
          <Layers className="w-3 h-3 mr-1" />
          Etiquetas
        </Button>
      </div>
    );
  }

  return (
    <Card className="absolute top-4 left-4 w-48 z-20 shadow-lg bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <Layers className="w-4 h-4 mr-1" />
            Etiquetas
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-5 w-5 p-0"
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-5 w-5 p-0"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Building className="w-3 h-3 text-gray-500" />
              <Label htmlFor="show-property-lots" className="text-xs">Lotes de Propiedad</Label>
            </div>
            <Switch 
              id="show-property-lots" 
              checked={showPropertyLots} 
              onCheckedChange={onTogglePropertyLots} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Leaf className="w-3 h-3 text-green-600" />
              <Label htmlFor="show-pasture-lots" className="text-xs">Lotes de Pastoreo</Label>
            </div>
            <Switch 
              id="show-pasture-lots" 
              checked={showPastureLots} 
              onCheckedChange={onTogglePastureLots} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-blue-600" />
              <Label htmlFor="show-property-name" className="text-xs">Nombre SkyRanch</Label>
            </div>
            <Switch 
              id="show-property-name" 
              checked={showPropertyName} 
              onCheckedChange={onTogglePropertyName} 
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MapLotLabelsControl;
