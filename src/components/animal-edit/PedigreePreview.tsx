import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, GitBranch } from 'lucide-react';
import type { ParsedPedigree } from '@/services/pedigree/asciiTreeParser';

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
  const gen3Count = countPopulatedFields(parsed.generation3);
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
    <Card className="mt-4 border-2 border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Vista Previa de Pedigrí
          </span>
          <span className="text-sm font-normal text-muted-foreground bg-background px-3 py-1 rounded-full border">
            {totalFields} campos detectados
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Generation 1 */}
          <div className="flex items-start space-x-3 relative pl-6">
            <div className="absolute left-0 top-3 w-4 h-px bg-border"></div>
            {getStatusIcon(gen1Count, 2)}
            <div className="flex-1 border-l-2 border-primary/30 pl-4">
              <h4 className="font-semibold text-sm mb-3">Generación 1 - Padres ({gen1Count}/2)</h4>
              <div className="space-y-2 text-sm">
                {parsed.generation1.father && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground font-medium">Padre:</span> 
                    <span className="font-semibold">{parsed.generation1.father}</span>
                  </div>
                )}
                {parsed.generation1.mother && (
                  <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/20 p-2 rounded">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="text-muted-foreground font-medium">Madre:</span> 
                    <span className="font-semibold">{parsed.generation1.mother}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generation 2 */}
          <div className="flex items-start space-x-3 relative pl-6">
            <div className="absolute left-0 top-3 w-4 h-px bg-border"></div>
            {getStatusIcon(gen2Count, 4)}
            <div className="flex-1 border-l-2 border-primary/30 pl-4">
              <h4 className="font-semibold text-sm mb-3">Generación 2 - Abuelos ({gen2Count}/4)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parsed.generation2.paternalGrandfather && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs">{parsed.generation2.paternalGrandfather}</span>
                  </div>
                )}
                {parsed.generation2.paternalGrandmother && (
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span className="text-xs">{parsed.generation2.paternalGrandmother}</span>
                  </div>
                )}
                {parsed.generation2.maternalGrandfather && (
                  <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/20 p-2 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                    <span className="text-xs">{parsed.generation2.maternalGrandfather}</span>
                  </div>
                )}
                {parsed.generation2.maternalGrandmother && (
                  <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/20 p-2 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                    <span className="text-xs">{parsed.generation2.maternalGrandmother}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generation 3 */}
          <div className="flex items-start space-x-3 relative pl-6">
            <div className="absolute left-0 top-3 w-4 h-px bg-border"></div>
            {getStatusIcon(gen3Count, 8)}
            <div className="flex-1 border-l-2 border-primary/30 pl-4">
              <h4 className="font-semibold text-sm mb-3">Generación 3 - Bisabuelos ({gen3Count}/8)</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  {parsed.generation3.paternalGreatGrandfatherFather && <div className="bg-blue-50 dark:bg-blue-950/10 p-1 rounded truncate">{parsed.generation3.paternalGreatGrandfatherFather}</div>}
                  {parsed.generation3.paternalGreatGrandmotherFather && <div className="bg-blue-50 dark:bg-blue-950/10 p-1 rounded truncate">{parsed.generation3.paternalGreatGrandmotherFather}</div>}
                  {parsed.generation3.paternalGreatGrandfatherMother && <div className="bg-blue-50 dark:bg-blue-950/10 p-1 rounded truncate">{parsed.generation3.paternalGreatGrandfatherMother}</div>}
                  {parsed.generation3.paternalGreatGrandmotherMother && <div className="bg-blue-50 dark:bg-blue-950/10 p-1 rounded truncate">{parsed.generation3.paternalGreatGrandmotherMother}</div>}
                </div>
                <div className="space-y-1">
                  {parsed.generation3.maternalGreatGrandfatherFather && <div className="bg-pink-50 dark:bg-pink-950/10 p-1 rounded truncate">{parsed.generation3.maternalGreatGrandfatherFather}</div>}
                  {parsed.generation3.maternalGreatGrandmotherFather && <div className="bg-pink-50 dark:bg-pink-950/10 p-1 rounded truncate">{parsed.generation3.maternalGreatGrandmotherFather}</div>}
                  {parsed.generation3.maternalGreatGrandfatherMother && <div className="bg-pink-50 dark:bg-pink-950/10 p-1 rounded truncate">{parsed.generation3.maternalGreatGrandfatherMother}</div>}
                  {parsed.generation3.maternalGreatGrandmotherMother && <div className="bg-pink-50 dark:bg-pink-950/10 p-1 rounded truncate">{parsed.generation3.maternalGreatGrandmotherMother}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Generation 4 */}
          <div className="flex items-start space-x-3 relative pl-6">
            <div className="absolute left-0 top-3 w-4 h-px bg-border"></div>
            {getStatusIcon(gen4Count, 16)}
            <div className="flex-1 border-l-2 border-primary/30 pl-4">
              <h4 className="font-semibold text-sm mb-3">Generación 4 - Tatarabuelos ({gen4Count}/16)</h4>
              {gen4Count > 0 && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Línea Paterna ({parsed.generation4.paternalLine.filter(n => n && n.trim().length > 0).length}/8)
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {parsed.generation4.paternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-950/10 p-1 rounded truncate">{name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      Línea Materna ({parsed.generation4.maternalLine.filter(n => n && n.trim().length > 0).length}/8)
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-xs">
                      {parsed.generation4.maternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="bg-pink-50 dark:bg-pink-950/10 p-1 rounded truncate">{name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generation 5 */}
          <div className="flex items-start space-x-3 relative pl-6">
            <div className="absolute left-0 top-3 w-4 h-px bg-border"></div>
            {getStatusIcon(gen5Count, 32)}
            <div className="flex-1 border-l-2 border-primary/30 pl-4">
              <h4 className="font-semibold text-sm mb-3">Generación 5 ({gen5Count}/32)</h4>
              {gen5Count > 0 && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Línea Paterna ({parsed.generation5.paternalLine.filter(n => n && n.trim().length > 0).length}/16)
                    </div>
                    <div className="grid grid-cols-8 gap-0.5 text-[10px]">
                      {parsed.generation5.paternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-950/10 p-0.5 rounded truncate" title={name}>{name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      Línea Materna ({parsed.generation5.maternalLine.filter(n => n && n.trim().length > 0).length}/16)
                    </div>
                    <div className="grid grid-cols-8 gap-0.5 text-[10px]">
                      {parsed.generation5.maternalLine.filter(n => n && n.trim().length > 0).map((name, idx) => (
                        <div key={idx} className="bg-pink-50 dark:bg-pink-950/10 p-0.5 rounded truncate" title={name}>{name}</div>
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
