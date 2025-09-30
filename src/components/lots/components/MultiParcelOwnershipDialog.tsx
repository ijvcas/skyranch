import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { analyzeMultiParcelOwnership, type GlobalOwnershipAnalysis, type OwnershipGroup } from '@/services/ownerAnalysisService';
import { Building2, MapPin, TrendingUp, Users, Loader2 } from 'lucide-react';
import OwnershipGroupCard from './OwnershipGroupCard';
import OwnershipSummaryStats from './OwnershipSummaryStats';

interface MultiParcelOwnershipDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupSelect?: (group: OwnershipGroup) => void;
}

const MultiParcelOwnershipDialog: React.FC<MultiParcelOwnershipDialogProps> = ({
  open,
  onClose,
  onGroupSelect
}) => {
  const [analysis, setAnalysis] = useState<GlobalOwnershipAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      performAnalysis();
    }
  }, [open]);

  const performAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeMultiParcelOwnership();
      setAnalysis(result);
      
      if (result.ownershipGroups.length === 0) {
        toast.info('No se encontraron propietarios con múltiples parcelas');
      } else {
        toast.success(`Análisis completado: ${result.multiParcelOwners} propietarios con múltiples parcelas`);
      }
    } catch (error) {
      console.error('Error analyzing multi-parcel ownership:', error);
      toast.error('Error al analizar la propiedad de parcelas');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: OwnershipGroup) => {
    setSelectedGroupId(group.id);
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Análisis de Propietarios Multi-Parcela
          </DialogTitle>
          <DialogDescription>
            Propietarios que poseen o co-poseen múltiples parcelas catastrales
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analizando propietarios...</span>
          </div>
        ) : analysis ? (
          <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-6">
              {/* Summary Statistics */}
              <OwnershipSummaryStats analysis={analysis} />

              {/* Ownership Groups */}
              {analysis.ownershipGroups.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Grupos de Propiedad ({analysis.ownershipGroups.length})
                    </h3>
                    <Badge variant="outline">
                      {analysis.multiParcelOwners} con múltiples parcelas
                    </Badge>
                  </div>

                  {analysis.ownershipGroups.map((group) => (
                    <OwnershipGroupCard
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupId === group.id}
                      onClick={() => handleGroupClick(group)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No se encontraron propietarios con múltiples parcelas
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Asegúrate de haber asignado propietarios a tus parcelas catastrales
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Unprocessed Owners */}
              {analysis.unprocessedOwners.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Propietarios con parcela única ({analysis.unprocessedOwners.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Propietarios que solo aparecen en una parcela
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.unprocessedOwners.slice(0, 20).map((owner) => (
                        <Badge key={owner.id} variant="secondary" className="text-xs">
                          {owner.owner_name}
                        </Badge>
                      ))}
                      {analysis.unprocessedOwners.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{analysis.unprocessedOwners.length - 20} más
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Notes */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Notas del Análisis
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Los propietarios se agrupan por similitud en nombre, email, teléfono y número de identificación</li>
                    <li>El análisis solo muestra grupos con múltiples parcelas</li>
                    <li>Los colores en el mapa corresponden a cada grupo de propiedad</li>
                    <li>Haz clic en un grupo para resaltarlo en el mapa</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : null}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={performAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              'Recargar Análisis'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiParcelOwnershipDialog;
