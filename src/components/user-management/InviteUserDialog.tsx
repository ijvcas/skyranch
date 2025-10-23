import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Copy, Check } from 'lucide-react';

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'worker' | 'manager' | 'admin'>('worker');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendInvitation = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email,
          role,
          invitedBy: user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setInvitationLink(data.invitationLink);
        toast({
          title: 'Invitación enviada',
          description: `Se ha enviado una invitación a ${email}`,
        });
        setEmail('');
      } else {
        throw new Error(data?.error || 'Error al enviar invitación');
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la invitación',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInvitationLink = async () => {
    if (invitationLink) {
      await navigator.clipboard.writeText(invitationLink);
      setLinkCopied(true);
      toast({
        title: 'Enlace copiado',
        description: 'El enlace de invitación se copió al portapapeles',
      });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setInvitationLink(null);
    setEmail('');
    setRole('worker');
    setLinkCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invitar Usuario por Email
          </DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico. El usuario recibirá un enlace para crear su cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!invitationLink}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={isLoading || !!invitationLink}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="worker">Trabajador</SelectItem>
                <SelectItem value="manager">Encargado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invitationLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-green-900">
                ✅ Invitación enviada exitosamente
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={invitationLink}
                  readOnly
                  className="text-xs bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyInvitationLink}
                  className="flex-shrink-0"
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-green-700">
                También puedes copiar este enlace para compartirlo manualmente
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {invitationLink ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!invitationLink && (
            <Button onClick={handleSendInvitation} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Invitación
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
