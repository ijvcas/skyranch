
import React from 'react';
import { type Lot } from '@/stores/lotStore';
import WorkingGoogleMapDrawing from './WorkingGoogleMapDrawing';

interface LotMapViewProps {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

const LotMapView: React.FC<LotMapViewProps> = ({ lots, onLotSelect }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Potreros</h2>
        <p className="text-gray-500 mb-4">
          Dibuja y gestiona tus lotes de pastoreo.
        </p>
      </div>
      
      <div className="w-full -mx-4 px-4">
        <WorkingGoogleMapDrawing 
          lots={lots}
          onLotSelect={onLotSelect}
        />
      </div>
    </div>
  );
};

export default LotMapView;
