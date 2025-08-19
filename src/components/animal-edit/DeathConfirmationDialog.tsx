import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

interface DeathConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  animalName: string;
}

const DeathConfirmationDialog: React.FC<DeathConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  animalName
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Fallecimiento
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas marcar a <strong>{animalName}</strong> como fallecido?
            <br /><br />
            Esta acción:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Cambiará el estado de vida del animal a "Fallecido"</li>
              <li>Quitará al animal de su lote actual (si está asignado)</li>
              <li>Será registrada en el historial del animal</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              console.log('🔄 Death confirmation dialog - Confirm button clicked');
              onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Confirmar Fallecimiento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeathConfirmationDialog;