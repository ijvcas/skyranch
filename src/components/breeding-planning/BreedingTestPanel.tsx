import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { FamilyRelationshipService } from '@/services/universal-breeding/familyRelationshipService';
import type { Animal } from '@/stores/animalStore';

export const BreedingTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{
    male: string;
    female: string;
    relationship: string;
    shouldBlock: boolean;
    details: string;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runIncestTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Mock animals for testing - these should match your actual database data
      const cria: Animal = {
        id: '34540e69-25f4-42bb-a5a3-fa066b83ce8e',
        name: 'CRÍA DE SHIVA Y JAZZ',
        tag: 'CRIA-001',
        species: 'ovino',
        breed: '',
        gender: 'macho',
        birthDate: '',
        weight: '',
        color: '',
        motherId: 'c43cd956-46b7-4890-b522-01a9ac2c1348', // SHIVA's ID
        fatherId: '07fc8cbd-7d0a-463c-9498-1b53b85bd542',
        healthStatus: 'healthy',
        notes: '',
        image: null
      };

      const shiva: Animal = {
        id: 'c43cd956-46b7-4890-b522-01a9ac2c1348',
        name: 'SHIVA',
        tag: 'SHIVA-001',
        species: 'ovino',
        breed: '',
        gender: 'hembra',
        birthDate: '',
        weight: '',
        color: '',
        motherId: '',
        fatherId: '',
        healthStatus: 'healthy',
        notes: '',
        image: null
      };

      // Test the specific CRÍA DE SHIVA Y JAZZ × SHIVA case
      const result = await FamilyRelationshipService.detectFamilyRelationship(cria, shiva);
      
      setTestResults([{
        male: cria.name,
        female: shiva.name,
        relationship: result.type,
        shouldBlock: result.shouldBlock,
        details: result.details
      }]);
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults([{
        male: 'TEST',
        female: 'ERROR',
        relationship: 'error',
        shouldBlock: false,
        details: `Error: ${error}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-4 h-4" />
          Pruebas de Detección de Consanguinidad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={runIncestTests}
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            {isRunning ? 'Ejecutando pruebas...' : 'Probar Detección de Incesto'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Resultados de Pruebas:</h4>
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {result.male} × {result.female}
                    </span>
                    {result.shouldBlock ? (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        BLOQUEADO
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        PERMITIDO
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>Relación: <span className="font-medium">{result.relationship}</span></div>
                    <div>Detalles: {result.details}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
            <strong>Nota:</strong> Este panel prueba la detección de relaciones familiares. 
            El caso CRÍA DE SHIVA Y JAZZ × SHIVA debe ser BLOQUEADO porque SHIVA es la madre de CRÍA.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};