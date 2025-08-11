
import React, { Suspense, lazy } from 'react';
import { type Lot } from '@/stores/lotStore';
const WorkingGoogleMapDrawing = lazy(() => import('./WorkingGoogleMapDrawing'));

interface LotMapViewProps {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

const LotMapView: React.FC<LotMapViewProps> = ({ lots, onLotSelect }) => {
  return (
    <div className="px-1 pb-4 -mx-2">
      <Suspense fallback={<div className="h-[420px] rounded-lg border" aria-busy="true" aria-label="Cargando mapa..." /> }>
        <WorkingGoogleMapDrawing 
          lots={lots}
          onLotSelect={onLotSelect}
        />
      </Suspense>
    </div>
  );
};

export default LotMapView;
