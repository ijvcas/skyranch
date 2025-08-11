
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Smartphone, Share, Chrome, Info } from 'lucide-react';
import { pwaInstallService, PWAInstallState } from '@/services/pwaInstallService';

const PWAInstallButton = () => {
  const [installState, setInstallState] = useState<PWAInstallState>(
    pwaInstallService.getInstallState()
  );
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaInstallService.subscribe(setInstallState);
    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    const success = await pwaInstallService.install();
    if (!success && !installState.deferredPrompt) {
      setShowInstructions(true);
    }
  };

  // Don't show if already installed
  if (installState.isInstalled || !installState.canInstall) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-gray-100"
          title="Instalar aplicación"
        >
          <Download className="w-5 h-5 text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src="/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" 
              alt="SkyRanch"
              className="w-10 h-10 rounded"
              loading="lazy"
              decoding="async"
            />
            <div>
              <DialogTitle>Instalar SkyRanch</DialogTitle>
              <DialogDescription>
                Acceso rápido desde tu pantalla de inicio
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {installState.isIOS ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <Share className="w-5 h-5" />
                <span className="font-medium">Para dispositivos iOS:</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Toca el botón de <strong>compartir ↗</strong> en Safari</li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma tocando <strong>"Añadir"</strong></li>
                </ol>
              </div>
            </div>
          ) : installState.isChrome ? (
            <div className="space-y-4">
              {installState.deferredPrompt ? (
                <>
                  <p className="text-sm text-gray-600">
                    Instala la app para usarla sin conexión y con acceso directo
                  </p>
                  <Button 
                    onClick={handleInstall}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar Ahora
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Chrome className="w-5 h-5" />
                    <span className="font-medium">Para Chrome:</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                      <li>Haz clic en los <strong>tres puntos (⋮)</strong> arriba a la derecha</li>
                      <li>Busca <strong>"Instalar SkyRanch"</strong></li>
                      <li>Haz clic en <strong>"Instalar"</strong></li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                      💡 También puedes buscar un icono de instalación (+) en la barra de direcciones
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Smartphone className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">
                La instalación como aplicación está disponible en Chrome, Edge o Safari.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallButton;
