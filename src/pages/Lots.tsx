
import React, { useEffect, useState } from 'react';
import { useLotStore, type Lot } from '@/stores/lotStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LotDetail from '@/components/lots/LotDetail';
import LotForm from '@/components/lots/LotForm';
import LotMapView from '@/components/lots/LotMapView';
import LotsGrid from '@/components/lots/LotsGrid';
import CadastralMapView from '@/components/lots/CadastralMapView';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPolygonDataForLots, syncAllLotAreasWithPolygons } from '@/services/lotPolygonService';
import { applySEO } from '@/utils/seo';
import { syncCadastralParcelsToLots } from '@/services/cadastralLotSyncService';
import { CacheCleanupService } from '@/services/cacheCleanupService';
import { useTranslation } from 'react-i18next';

const Lots = () => {
  const { t } = useTranslation(['lots', 'common']);
  const { lots, loadLots, deleteLot, isLoading, setSelectedLot } = useLotStore();
  const [activeTab, setActiveTab] = useState('map');
  const [selectedLot, setSelectedLotState] = useState<Lot | null>(null);
  const [polygonData, setPolygonData] = useState<Array<{lotId: string; areaHectares?: number}>>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);

  // SEO metadata for Lots page
  useEffect(() => {
    applySEO({
      title: 'Mapas — SKYRANCH',
      description: 'Mapas de potreros y catastral en SKYRANCH.',
      canonical: window.location.href
    });
  }, []);

// Load lots and polygon data + ensure property lots are synced for this user
  useEffect(() => {
    console.log('🔄 Loading SHARED lots and polygon data...');

    // Clear cached data if needed to ensure fresh shared data
    if (CacheCleanupService.shouldClearCache()) {
      console.log('🗑️ Clearing cached polygon data to load fresh shared data');
      CacheCleanupService.clearAllCaches();
    }

    // Load lots first
    loadLots();
    loadPolygonData();

    // Then sync cadastral parcels
    syncCadastralParcelsToLots()
      .then(() => {
        console.log('✅ Cadastral sync complete, reloading lots...');
        loadLots();
        loadPolygonData();
      })
      .catch((e) => {
        console.warn('⚠️ Cadastral sync skipped/failed:', e);
      });
    
    // Sync polygon areas with lot sizes to ensure consistency
    syncAllLotAreasWithPolygons().then(success => {
      if (success) {
        console.log('✅ Successfully synchronized all lot areas with polygons');
      }
    });
  }, [loadLots]);

  const loadPolygonData = async () => {
    try {
      const data = await getPolygonDataForLots();
      setPolygonData(data);
    } catch (error) {
      console.error('❌ Error loading polygon data:', error);
    }
  };

  const handleLotSelect = (lotId: string) => {
    const lot = lots.find(l => l.id === lotId);
    if (lot) {
      setSelectedLotState(lot);
      setActiveTab('detail');
      setSelectedLot(lot);
    }
  };

  const handleCreateLot = () => {
    console.log('🔄 Opening manual lot creation form...');
    setShowCreateForm(true);
  };


  const handleDeleteLot = (lotId: string) => {
    setLotToDelete(lotId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLot = async () => {
    if (lotToDelete) {
      const success = await deleteLot(lotToDelete);
      if (success) {
        toast.success(t('lots:messages.deleted'));
        setShowDeleteDialog(false);
        setLotToDelete(null);
        
        // If we were viewing the deleted lot, go back to map
        if (selectedLot?.id === lotToDelete) {
          setSelectedLotState(null);
          setActiveTab('map');
        }
      } else {
        toast.error(t('lots:messages.deleteError'));
      }
    }
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    loadLots();
    loadPolygonData();
  };

  // Reload polygon data when on map tab
  useEffect(() => {
    if (activeTab === 'map') {
      loadPolygonData();
    }
  }, [activeTab]);

  return (
    <div className="page-with-logo">
      <div className="container mx-auto pb-6 px-2 md:px-4">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-center">{t('lots:title')}</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-col sm:flex-row w-full sm:w-auto">
            
            <TabsTrigger value="map" className="w-full sm:w-auto">{t('lots:tabs.pastures')}</TabsTrigger>
            <TabsTrigger value="cadastral" className="w-full sm:w-auto">{t('lots:tabs.cadastral')}</TabsTrigger>
            {selectedLot && <TabsTrigger value="detail" className="w-full sm:w-auto">{t('common:actions.view')}</TabsTrigger>}
          </TabsList>
          
          
          <TabsContent value="map">
            <div className="flex justify-center mb-4">
              <Button variant="gradient" onClick={handleCreateLot}>
                <Plus className="w-4 h-4" />
                {t('lots:newLot')}
              </Button>
            </div>
            <LotMapView 
              lots={lots}
              onLotSelect={handleLotSelect}
            />
            <div className="mt-6">
              <LotsGrid 
                lots={lots.filter(l => !(l as any).autoGenerated)}
                onLotSelect={handleLotSelect}
                onDeleteLot={handleDeleteLot}
                polygonData={polygonData}
              />
            </div>
          </TabsContent>

          <TabsContent value="cadastral">
            <CadastralMapView />
          </TabsContent>
          
          <TabsContent value="detail">
            {selectedLot && (
              <LotDetail 
                lot={selectedLot}
                onBack={() => {
                  setActiveTab('map');
                  setSelectedLotState(null);
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Create Lot Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('lots:form.manualCreation')}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <LotForm onClose={handleFormClose} />
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('lots:deleteLot')}</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('common:confirmations.warning')}</AlertTitle>
              <AlertDescription>
                {t('lots:messages.confirmDelete')}
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline">{t('common:actions.cancel')}</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteLot}
              >
                {t('common:actions.delete')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Lots;
