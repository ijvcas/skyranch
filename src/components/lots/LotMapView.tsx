
import React from 'react';
import { type Lot } from '@/stores/lotStore';
import WorkingGoogleMapDrawing from './WorkingGoogleMapDrawing';

interface LotMapViewProps {
  lots: Lot[];
  onLotSelect: (lotId: string) => void;
}

const LotMapView: React.FC<LotMapViewProps> = ({ lots, onLotSelect }) => {
  return (
    <div className="px-2 pb-4">
      <WorkingGoogleMapDrawing 
        lots={lots}
        onLotSelect={onLotSelect}
      />
    </div>
  );
};

export default LotMapView;
