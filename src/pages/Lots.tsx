
import React, { useEffect, useState } from 'react';
import { useLotStore, type Lot } from '@/stores/lotStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LotDetail from '@/components/lots/LotDetail';
import LotForm from '@/components/lots/LotForm';
import LotMapView from '@/components/lots/LotMapView';
import LotsOverview from '@/components/lots/LotsOverview';
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
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getPolygonDataForLots, syncAllLotAreasWithPolygons } from '@/services/lotPolygonService';

const Lots = () => {
  const { lots, loadLots, deleteLot, isLoading, setSelectedLot } = useLotStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLot, setSelectedLotState] = useState<Lot | null>(null);
  const [polygonData, setPolygonData] = useState<Array<{lotId: string; areaHectares?: number}>>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);

  // Load lots and polygon data
  useEffect(() => {
    console.log('🔄 Loading lots and polygon data...');
    loadLots();
    loadPolygonData();
    
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

  const handleNavigateToCadastral = () => {
    setActiveTab('cadastral');
  };

  const handleDeleteLot = (lotId: string) => {
    setLotToDelete(lotId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteLot = async () => {
    if (lotToDelete) {
      const success = await deleteLot(lotToDelete);
      if (success) {
        toast.success('Lote eliminado correctamente');
        setShowDeleteDialog(false);
        setLotToDelete(null);
        
        // If we were viewing the deleted lot, go back to overview
        if (selectedLot?.id === lotToDelete) {
          setSelectedLotState(null);
          setActiveTab('overview');
        }
      } else {
        toast.error('Error al eliminar el lote');
      }
    }
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    loadLots();
    loadPolygonData();
  };

  // Reload polygon data when active tab changes to overview or map
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'map') {
      loadPolygonData();
    }
  }, [activeTab]);

  return (
    <div className="page-with-logo">
      <div className="container mx-auto pt-3 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Lotes</h1>
            <p className="text-gray-500">Administra los lotes de tu finca y datos catastrales</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-col sm:flex-row w-full sm:w-auto">
            <TabsTrigger value="overview" className="w-full sm:w-auto">Resumen</TabsTrigger>
            <TabsTrigger value="map" className="w-full sm:w-auto">Mapa de Lotes</TabsTrigger>
            <TabsTrigger value="cadastral" className="w-full sm:w-auto">Mapa Catastral</TabsTrigger>
            {selectedLot && <TabsTrigger value="detail" className="w-full sm:w-auto">Detalle</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview">
            <LotsOverview 
              lots={lots}
              isLoading={isLoading}
              onLotSelect={handleLotSelect}
              onCreateLot={handleCreateLot}
              onDeleteLot={handleDeleteLot}
              onNavigateToCadastral={handleNavigateToCadastral}
              polygonData={polygonData}
            />
          </TabsContent>
          
          <TabsContent value="map">
            <LotMapView 
              lots={lots}
              onLotSelect={handleLotSelect}
            />
          </TabsContent>

          <TabsContent value="cadastral">
            <CadastralMapView />
          </TabsContent>
          
          <TabsContent value="detail">
            {selectedLot && (
              <LotDetail 
                lot={selectedLot}
                onBack={() => {
                  setActiveTab('overview');
                  setSelectedLotState(null);
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Create Lot Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Lote Manual</DialogTitle>
            </DialogHeader>
            <LotForm onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
        
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                ¿Estás seguro de que deseas eliminar este lote? Esta acción no se puede deshacer.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteLot}
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Lots;
