import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LocationCapture from '@/components/location/LocationCapture';
import type { LocationCoordinates } from '@/services/mobile/locationService';
import { useNFCScanner } from '@/hooks/useNFCScanner';
import { Radio, Loader2, QrCode } from 'lucide-react';
import { isIOSDevice } from '@/utils/platformDetection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BasicInformationFormProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
  onLocationChange?: (location: LocationCoordinates | null) => void;
  disabled?: boolean;
  onScanBarcode?: () => void;
  isScanning?: boolean;
}

const BasicInformationForm = ({ formData, onInputChange, onLocationChange, disabled = false, onScanBarcode, isScanning: isScanningBarcode }: BasicInformationFormProps) => {
  const { scanNFC, isScanning } = useNFCScanner();
  const isIOS = isIOSDevice();

  const handleNFCScan = async () => {
    const tagData = await scanNFC();
    if (tagData) {
      onInputChange('tag', tagData);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Información Básica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name={`animal-name-${Math.random()}`}
              type="text"
              value={formData.name || ''}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Ej: Bella"
              className="mt-1"
              disabled={disabled}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-ignore="true"
              data-form-type="other"
              spellCheck="false"
            />
          </div>
          <div>
            <Label htmlFor="tag">Número de Etiqueta / NFC *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="tag"
                name={`animal-tag-${Math.random()}`}
                type="text"
                value={formData.tag || ''}
                onChange={(e) => onInputChange('tag', e.target.value)}
                placeholder="Ej: 001 o escanea transponder"
                className="flex-1"
                disabled={disabled}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bitwarden-ignore="true"
                data-form-type="other"
                spellCheck="false"
              />
              {onScanBarcode && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onScanBarcode}
                  disabled={disabled || isScanningBarcode}
                  title="Escanear Código de Barras"
                >
                  {isScanningBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </Button>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleNFCScan}
                      disabled={disabled || isScanning || isIOS}
                      title={isIOS ? "NFC no disponible en iOS - Usa código de barras" : "Escanear Transponder NFC"}
                    >
                      {isScanning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Radio className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isIOS && (
                    <TooltipContent>
                      <p>NFC temporalmente no disponible en iOS. Usa código de barras.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="species">Especie *</Label>
            <select
              value={formData.species || ''}
              onChange={(e) => onInputChange('species', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Seleccionar especie</option>
              <option value="bovino">Bovino</option>
              <option value="ovino">Ovino</option>
              <option value="caprino">Caprino</option>
              <option value="porcino">Porcino</option>
              <option value="equino">Equino</option>
              <option value="aviar">Aviar</option>
              <option value="caninos">Caninos</option>
            </select>
          </div>
          <div>
            <Label htmlFor="breed">Raza</Label>
            <Input
              id="breed"
              name={`animal-breed-${Math.random()}`}
              type="text"
              value={formData.breed || ''}
              onChange={(e) => onInputChange('breed', e.target.value)}
              placeholder="Ej: Holstein"
              className="mt-1"
              disabled={disabled}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-ignore="true"
              data-form-type="other"
              spellCheck="false"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
            <Input
              id="birthDate"
              name={`animal-birthdate-${Math.random()}`}
              type="date"
              value={formData.birthDate || ''}
              onChange={(e) => onInputChange('birthDate', e.target.value)}
              className="mt-1"
              disabled={disabled}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-ignore="true"
              data-form-type="other"
            />
          </div>
          <div>
            <Label htmlFor="gender">Sexo</Label>
            <select
              value={formData.gender || ''}
              onChange={(e) => onInputChange('gender', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Seleccionar sexo</option>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              name={`animal-weight-${Math.random()}`}
              type="number"
              value={formData.weight || ''}
              onChange={(e) => onInputChange('weight', e.target.value)}
              placeholder="Ej: 450"
              className="mt-1"
              disabled={disabled}
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bitwarden-ignore="true"
              data-form-type="other"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="color">Color/Marcas</Label>
          <Input
            id="color"
            name={`animal-color-${Math.random()}`}
            type="text"
            value={formData.color || ''}
            onChange={(e) => onInputChange('color', e.target.value)}
            placeholder="Ej: Negro con manchas blancas"
            className="mt-1"
            disabled={disabled}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bitwarden-ignore="true"
            data-form-type="other"
            spellCheck="false"
          />
        </div>

        {onLocationChange && (
          <div>
            <Label>Ubicación GPS</Label>
            <LocationCapture
              onLocationCaptured={onLocationChange}
              currentLocation={formData.location}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BasicInformationForm;
