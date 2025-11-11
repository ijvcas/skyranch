/**
 * NFC Animal Dialog Component
 * Manages NFC transponder operations for animals
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Radio, Link, History, Edit } from 'lucide-react';
import { useNFCAnimalLink } from '@/hooks/useNFCAnimalLink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NFCAnimalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  animalName: string;
  currentNFCTag?: string;
  nfcScanCount?: number;
  nfcLastScanned?: string;
}

export function NFCAnimalDialog({
  open,
  onOpenChange,
  animalId,
  animalName,
  currentNFCTag,
  nfcScanCount = 0,
  nfcLastScanned,
}: NFCAnimalDialogProps) {
  const { scanAndLink, writeTag, isScanning, isWriting } = useNFCAnimalLink();
  const [activeTab, setActiveTab] = useState('read');

  const handleReadNFC = async () => {
    await scanAndLink(animalId);
  };

  const handleWriteNFC = async () => {
    const success = await writeTag(animalId);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>NFC Transponder Management</DialogTitle>
          <DialogDescription>
            Manage NFC transponder for {animalName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="read">
              <Radio className="w-4 h-4 mr-2" />
              Read
            </TabsTrigger>
            <TabsTrigger value="write">
              <Edit className="w-4 h-4 mr-2" />
              Write
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-4 h-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="read" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Read NFC Transponder</CardTitle>
                <CardDescription>
                  Scan an NFC transponder to read its data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Hold your device near the animal's NFC transponder to read it.
                  This works with ISO 14443 A/B and ISO 15693 compatible transponders.
                </div>
                
                {currentNFCTag && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Current NFC Tag</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">
                      {currentNFCTag}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReadNFC}
                  disabled={isScanning}
                  className="w-full"
                >
                  <Radio className={`w-4 h-4 mr-2 ${isScanning ? 'animate-pulse' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Scan Transponder'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="write" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Write to NFC Transponder</CardTitle>
                <CardDescription>
                  Write animal ID to a new NFC transponder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This will write the animal ID to an NFC transponder in NDEF format.
                  Make sure to use a writable transponder.
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="text-sm font-medium">Data to Write</div>
                  <div className="text-xs text-muted-foreground">
                    Animal ID: <span className="font-mono">{animalId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Format: <span className="font-mono">NDEF TEXT</span>
                  </div>
                </div>

                <Button
                  onClick={handleWriteNFC}
                  disabled={isWriting}
                  className="w-full"
                >
                  <Edit className={`w-4 h-4 mr-2 ${isWriting ? 'animate-pulse' : ''}`} />
                  {isWriting ? 'Writing...' : 'Write to Transponder'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Link Existing Transponder</CardTitle>
                <CardDescription>
                  Link an existing NFC transponder to this animal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Scan an existing transponder to link it to {animalName}.
                  This is useful for pre-programmed transponders.
                </div>

                {currentNFCTag && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Warning: This will replace the current NFC tag link
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReadNFC}
                  disabled={isScanning}
                  className="w-full"
                >
                  <Link className={`w-4 h-4 mr-2 ${isScanning ? 'animate-pulse' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Scan & Link Transponder'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>
                  NFC transponder usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentNFCTag ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Tag ID</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
                          {currentNFCTag}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Scan Count</div>
                        <div className="text-2xl font-bold mt-1">
                          {nfcScanCount}
                        </div>
                      </div>
                    </div>

                    {nfcLastScanned && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm font-medium">Last Scanned</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(nfcLastScanned).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No NFC transponder linked to this animal yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
