import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';
import { ParcelOwner } from '@/services/parcelOwnersService';
import { analyzeOwnerSimilarity, OwnerAnalysisResult, OwnerSimilarity } from '@/services/ownerAnalysisService';
import { useToast } from '@/hooks/use-toast';

interface SimilarOwnersDialogProps {
  owner: ParcelOwner | null;
  open: boolean;
  onClose: () => void;
}

export const SimilarOwnersDialog: React.FC<SimilarOwnersDialogProps> = ({
  owner,
  open,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<OwnerAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && owner) {
      performAnalysis();
    }
  }, [open, owner]);

  const performAnalysis = async () => {
    if (!owner) return;

    setLoading(true);
    try {
      const result = await analyzeOwnerSimilarity(owner);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing owner similarity:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar el análisis de similitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const SimilarOwnerCard: React.FC<{ similarity: OwnerSimilarity }> = ({ similarity }) => (
    <Card className="border-l-4" style={{ borderLeftColor: getSimilarityColor(similarity.similarityScore) }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{similarity.owner.owner_name}</h4>
          <Badge 
            variant="secondary" 
            style={{ 
              backgroundColor: getSimilarityColor(similarity.similarityScore),
              color: 'white'
            }}
          >
            {similarity.similarityScore}% similar
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          {similarity.owner.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span>{similarity.owner.contact_email}</span>
            </div>
          )}
          {similarity.owner.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{similarity.owner.contact_phone}</span>
            </div>
          )}
          {similarity.owner.contact_address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>{similarity.owner.contact_address}</span>
            </div>
          )}
        </div>

        {similarity.matchReasons.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Coincidencias:</p>
            <div className="flex flex-wrap gap-1">
              {similarity.matchReasons.map((reason, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          {similarity.owner.ownership_percentage}% de propiedad en parcela {similarity.owner.parcel_id}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Análisis de Propietarios Similares
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Analizando similitudes...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Resumen del Análisis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analysis.similarOwners.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Propietarios similares encontrados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {analysis.relatedParcels.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Parcelas relacionadas
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getConfidenceColor(analysis.analysisConfidence)}`}>
                      {analysis.analysisConfidence.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Confianza del análisis
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Owner */}
            <Card>
              <CardHeader>
                <CardTitle>Propietario Analizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{owner?.owner_name}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {owner?.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{owner.contact_email}</span>
                        </div>
                      )}
                      {owner?.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span>{owner.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {owner?.owner_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Similar Owners */}
            {analysis.similarOwners.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-medium">Propietarios Similares Detectados</h3>
                </div>
                <div className="space-y-3">
                  {analysis.similarOwners.map((similarity, index) => (
                    <SimilarOwnerCard key={index} similarity={similarity} />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron propietarios similares</h3>
                  <p className="text-muted-foreground">
                    No se detectaron coincidencias significativas con otros propietarios en la base de datos.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Analysis Notes */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Notas del Análisis</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• El análisis compara nombres, emails, teléfonos y números de identificación</li>
                  <li>• Las coincidencias de 80%+ pueden indicar posibles duplicados</li>
                  <li>• Las coincidencias de 50-79% sugieren propietarios relacionados</li>
                  <li>• Las coincidencias de 30-49% indican similitudes menores</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se pudo realizar el análisis</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};