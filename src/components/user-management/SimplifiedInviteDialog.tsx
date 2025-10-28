import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimplifiedInviteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SimplifiedInviteDialog: React.FC<SimplifiedInviteDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const inviteLink = 'https://skyranch.lovable.app/register';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Enlace copiado",
        description: "El enlace de invitación se copió al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            <DialogTitle>Invitar Nuevos Usuarios</DialogTitle>
          </div>
          <DialogDescription>
            Comparte este enlace con nuevos usuarios para que creen su cuenta en FARMIKA
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">
              ℹ️ Información importante:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Los nuevos usuarios crearán su propia contraseña</li>
              <li>Tendrán rol de <strong>Trabajador</strong> por defecto</li>
              <li>Puedes cambiar su rol después desde esta sección</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyLink}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Enlace
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplifiedInviteDialog;
