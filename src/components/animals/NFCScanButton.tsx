/**
 * Quick NFC Scan Button Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isIOSDevice } from '@/utils/platformDetection';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function NFCScanButton() {
  const { toast } = useToast();
  const isIOS = isIOSDevice();

  const handleClick = () => {
    if (isIOS) {
      toast({
        title: 'NFC Unavailable',
        description: 'NFC scanning is temporarily unavailable on iOS. Please use barcode/QR scanning instead.',
        variant: 'destructive',
      });
    }
  };

  if (isIOS) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled
            >
              <QrCode className="w-4 h-4 mr-2" />
              Use Barcode
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>NFC temporarily unavailable on iOS. Use barcode scanning instead.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null; // Hide on non-iOS for now since NFC is not working
}
