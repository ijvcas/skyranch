import { Button } from '@/components/ui/button';
import { QrCode, Loader2 } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BarcodeScanButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onScanComplete?: (animalId: string) => void;
}

export function BarcodeScanButton({ 
  variant = 'outline', 
  size = 'default',
  className,
  onScanComplete 
}: BarcodeScanButtonProps) {
  const { scanBarcode, isScanning } = useBarcodeScanner();
  const navigate = useNavigate();

  const handleScan = async () => {
    const result = await scanBarcode();
    
    if (result) {
      if (result.type === 'animal') {
        toast.success(`Found: ${result.name}`);
        onScanComplete?.(result.id);
        navigate(`/animals/${result.id}`);
      } else {
        toast.info('This barcode is not linked to an animal');
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleScan}
      disabled={isScanning}
      className={className}
    >
      {isScanning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <QrCode className="h-4 w-4" />
      )}
      {size !== 'icon' && (isScanning ? 'Scanning...' : 'Scan Barcode')}
    </Button>
  );
}
