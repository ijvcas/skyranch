
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import { usePWADetection } from '@/hooks/usePWADetection';
import PWAiOSInstructions from '@/components/pwa/PWAiOSInstructions';
import PWAChromeInstructions from '@/components/pwa/PWAChromeInstructions';
import PWADebugInfo from '@/components/pwa/PWADebugInfo';

const DashboardPWAPrompt = () => {
  const {
    deferredPrompt,
    showPrompt,
    isIOS,
    isChrome,
    isStandalone,
    debugMode,
    setDeferredPrompt,
    setShowPrompt,
    setDebugMode,
  } = usePWADetection();

  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available');
      return;
    }

    console.log('🚀 Triggering PWA install...');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('📊 Install outcome:', outcome);
    if (outcome === 'accepted') {
      console.log('✅ PWA installation accepted');
    } else {
      console.log('❌ PWA installation declined');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleManualInstall = () => {
    setShowInstructions(true);
  };

  const handleDismiss = () => {
    console.log('🙈 PWA prompt dismissed by user');
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleForceShow = () => {
    console.log('🔧 Force showing PWA prompt');
    localStorage.removeItem('pwa-prompt-dismissed');
    setShowPrompt(true);
    setDebugMode(true);
  };

  // Debug function accessible from console
  (window as any).showPWAPrompt = handleForceShow;
  (window as any).clearPWADismissal = () => {
    localStorage.removeItem('pwa-prompt-dismissed');
    console.log('🧹 PWA dismissal cleared');
  };

  // Don't show if already installed (unless debug mode)
  if (!showPrompt || (isStandalone && !debugMode)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-lg">
      <div className="bg-white border-2 border-green-200 rounded-lg shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" 
              alt="SkyRanch"
              className="w-12 h-12 rounded"
              loading="lazy"
              decoding="async"
            />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Instala SkyRanch</h3>
              <p className="text-sm text-gray-600">Acceso rápido desde tu pantalla de inicio</p>
              {debugMode && (
                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                  Debug: Deferred prompt = {deferredPrompt ? 'Available' : 'Not available'}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!debugMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDebugMode(true)}
                className="p-1 h-auto text-gray-400 hover:text-gray-600"
                title="Debug mode"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="p-1 h-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {isIOS ? (
          <PWAiOSInstructions />
        ) : isChrome ? (
          <PWAChromeInstructions
            deferredPrompt={deferredPrompt}
            showInstructions={showInstructions}
            onInstall={handleInstall}
            onShowInstructions={handleManualInstall}
            onHideInstructions={() => setShowInstructions(false)}
          />
        ) : null}

        {debugMode && (
          <PWADebugInfo 
            deferredPrompt={deferredPrompt}
            onForceShow={handleForceShow}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPWAPrompt;
