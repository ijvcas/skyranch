import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ParsedPedigree } from '@/services/pedigree/textParser';

interface PedigreePreviewProps {
  parsed: ParsedPedigree;
  onApply: () => void;
  onCancel: () => void;
}

const PedigreePreview: React.FC<PedigreePreviewProps> = ({ parsed, onApply, onCancel }) => {
  const countPopulatedFields = (gen: any): number => {
    if (typeof gen === 'object' && !Array.isArray(gen)) {
      return Object.values(gen).filter(v => v && String(v).trim().length > 0).length;
    }
    if (Array.isArray(gen)) {
      return gen.filter(v => v && v.trim().length > 0).length;
    }
    return 0;
  };

  const gen1Count = countPopulatedFields(parsed.generation1);
  const gen2Count = countPopulatedFields(parsed.generation2);
  const gen3Count = parsed.generation3.filter(n => n && n.trim().length > 0).length;
  const gen4Count = parsed.generation4.paternalLine.filter(n => n && n.trim().length > 0).length +
                    parsed.generation4.maternalLine.filter(n => n && n.trim().length > 0).length;
  const gen5Count = parsed.generation5.paternalLine.filter(n => n && n.trim().length > 0).length +
                    parsed.generation5.maternalLine.filter(n => n && n.trim().length > 0).length;

  const totalFields = gen1Count + gen2Count + gen3Count + gen4Count + gen5Count;

  const getStatusIcon = (count: number, expected: number) => {
    if (count === expected) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (count > 0) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-gray-400" />;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Vista Previa de Pedigrí</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalFields} campos detectados
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Generation 1 */}
          <div className="flex items-start space-x-3">
            {getStatusIcon(gen1Count, 2)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Generación 1 - Padres ({gen1Count}/2)</h4>
              <div className="mt-2 space-y-1 text-sm">
                {parsed.generation1.father && (
                  <div><span className="text-muted-foreground">Padre:</span> {parsed.generation1.father}</div>
                )}
                {parsed.generation1.mother && (
                  <div><span className="text-muted-foreground">Madre:</span> {parsed.generation1.mother}</div>
                )}
              </div>
            </div>
          </div>

          {/* Generation 2 */}
          <div className="flex items-start space-x-3">
            {getStatusIcon(gen2Count, 4)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Generación 2 - Abuelos ({gen2Count}/4)</h4>
              <div className="mt-2 space-y-1 text-sm">
                {parsed.generation2.paternalGrandfather && (
                  <div><span className="text-muted-foreground">Abuelo Paterno:</span> {parsed.generation2.paternalGrandfather}</div>
                )}
                {parsed.generation2.paternalGrandmother && (
                  <div><span className="text-muted-foreground">Abuela Paterna:</span> {parsed.generation2.paternalGrandmother}</div>
                )}
                {parsed.generation2.maternalGrandfather && (
                  <div><span className="text-muted-foreground">Abuelo Materno:</span> {parsed.generation2.maternalGrandfather}</div>
                )}
                {parsed.generation2.maternalGrandmother && (
                  <div><span className="text-muted-foreground">Abuela Materna:</span> {parsed.generation2.maternalGrandmother}</div>
                )}
              </div>
            </div>
          </div>

          {/* Generation 3 */}
          <div className="flex items-start space-x-3">
            {getStatusIcon(gen3Count, 8)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Generación 3 - Bisabuelos ({gen3Count}/8)</h4>
              {gen3Count > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {parsed.generation3.filter(n => n && n.trim().length > 0).map((name, idx) => (
                    <div key={idx} className="text-muted-foreground">• {name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generation 4 */}
          <div className="flex items-start space-x-3">
            {getStatusIcon(gen4Count, 16)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Generación 4 - Tatarabuelos ({gen4Count}/16)</h4>
              {gen4Count > 0 && (
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Línea Paterna:</div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      {parsed.generation4.paternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="text-muted-foreground">• {name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Línea Materna:</div>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      {parsed.generation4.maternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="text-muted-foreground">• {name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation 5 */}
          <div className="flex items-start space-x-3">
            {getStatusIcon(gen5Count, 32)}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Generación 5 ({gen5Count}/32)</h4>
              {gen5Count > 0 && (
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Línea Paterna:</div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      {parsed.generation5.paternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="text-muted-foreground text-xs">• {name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Línea Materna:</div>
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      {parsed.generation5.maternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="text-muted-foreground text-xs">• {name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onApply}>
              Aplicar Pedigrí ({totalFields} campos)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PedigreePreview;
