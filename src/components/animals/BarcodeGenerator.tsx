import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface BarcodeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  animalName: string;
  animalTag: string;
}

export function BarcodeGenerator({
  open,
  onOpenChange,
  animalId,
  animalName,
  animalTag,
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      generateQRCode();
    }
  }, [open, animalId]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      // Generate QR code with animal ID
      await QRCode.toCanvas(canvasRef.current, animalId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${animalTag}-qr-code.png`;
    link.href = url;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !canvasRef.current) return;

    const imageUrl = canvasRef.current.toDataURL('image/png');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${animalTag}</title>
          <style>
            body {
              margin: 0;
              padding: 20mm;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .label {
              width: 50mm;
              height: 70mm;
              margin: 0 auto;
              border: 1px dashed #ccc;
              padding: 5mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 40mm;
              height: 40mm;
            }
            .info {
              margin-top: 2mm;
              font-size: 10pt;
            }
            .tag {
              font-weight: bold;
              font-size: 14pt;
            }
            @media print {
              .label {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${imageUrl}" alt="QR Code" />
            <div class="info">
              <div class="tag">${animalTag}</div>
              <div>${animalName}</div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {animalTag}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
            <canvas ref={canvasRef} className="max-w-full" />
            <div className="mt-4 text-center">
              <p className="font-semibold">{animalName}</p>
              <p className="text-sm text-muted-foreground">{animalTag}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Scan this QR code with FARMIKA to quickly access this animal's details
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
