
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Users, MapPin, Activity, Calendar, Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLotStore, type Lot } from '@/stores/lotStore';
import { useAnimalStore } from '@/stores/animalStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import LotForm from './LotForm';
import AnimalAssignmentForm from './AnimalAssignmentForm';

interface LotDetailProps {
  lot: Lot;
  onBack: () => void;
}

const LotDetail = ({ lot, onBack }: LotDetailProps) => {
  const { assignments, loadAssignments, removeAnimal, loadGrazingMetrics, getGrazingMetrics, loadLots } = useLotStore();
  const { animals, loadAnimals } = useAnimalStore();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    loadAssignments(lot.id);
    loadAnimals();
    loadGrazingMetrics(lot.id);
  }, [lot.id, loadAssignments, loadAnimals, loadGrazingMetrics]);

  const activeAssignments = assignments.filter(a => !a.removedDate);
  const assignedAnimals = activeAssignments.map(assignment => {
    const animal = animals.find(a => a.id === assignment.animalId);
    return { ...assignment, animal };
  }).filter(item => item.animal);

  // Get grazing metrics from store
  const grazingMetrics = getGrazingMetrics(lot.id);
  
  // Legacy calculations for fallback
  const capacity = lot.capacity ?? 0;
  const occupancy = capacity > 0 ? assignedAnimals.length / capacity : 0;

  const handleRemoveAnimal = async (animalId: string) => {
    const success = await removeAnimal(animalId, lot.id);
    if (success) {
      await loadAssignments(lot.id);
      await loadGrazingMetrics(lot.id);
      await loadLots(); // Refresh lot data to update metrics
      toast.success('Animal removido del lote exitosamente');
    } else {
      toast.error('Error al remover el animal del lote');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resting': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGrassConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-400';
      case 'poor': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const days = Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getRotationStatusBadge = () => {
    if (!grazingMetrics) return null;
    
    if (grazingMetrics.isOverdue) {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Sobrepasteando
        </Badge>
      );
    }
    
    if (grazingMetrics.expectedExitDate) {
      const daysRemaining = getDaysRemaining(grazingMetrics.expectedExitDate);
      if (daysRemaining !== null && daysRemaining <= 2) {
        return (
          <Badge variant="destructive" className="ml-2">
            <Clock className="w-3 h-3 mr-1" />
            Salida en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
          </Badge>
        );
      }
    }
    
    if (grazingMetrics.lotStatus === 'available') {
      return (
        <Badge variant="default" className="ml-2">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Disponible
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16 md:mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lot.name}</h1>
            {lot.description && (
              <p className="text-sm text-gray-600 mt-1">{lot.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Asignar Animal al Lote</DialogTitle>
              </DialogHeader>
              <AnimalAssignmentForm 
                lotId={lot.id} 
                onClose={() => setShowAssignForm(false)} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Lote</DialogTitle>
              </DialogHeader>
              <LotForm lot={lot} onClose={() => setShowEditForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lot Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Información del Lote
              </CardTitle>
              <Button 
                variant="outline" 
                size="icon" 
                aria-label="Editar lote" 
                onClick={() => setShowEditForm(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estado</span>
                <Badge className={getStatusColor(grazingMetrics?.lotStatus || (assignedAnimals.length > 0 ? 'active' : 'available'))}>
                  {grazingMetrics?.lotStatus === 'active' ? 'En Uso' :
                   grazingMetrics?.lotStatus === 'resting' ? 'En Descanso' :
                   grazingMetrics?.lotStatus === 'available' ? 'Disponible' :
                   assignedAnimals.length > 0 ? 'En Uso' : 'Disponible'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Condición del Pasto</span>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getGrassConditionColor(lot.grassCondition)}`} />
                  <span className="text-sm capitalize">{lot.grassCondition}</span>
                </div>
              </div>
              
              {lot.sizeHectares && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tamaño</span>
                  <span className="text-sm">{Number(lot.sizeHectares).toFixed(4)} ha</span>
                </div>
              )}
              
              {lot.capacity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capacidad</span>
                  <span className="text-sm">{lot.capacity} animales</span>
                </div>
              )}
              
              {lot.grassType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tipo de Pasto</span>
                  <span className="text-sm">{lot.grassType}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Animales Actuales</span>
                <span className="font-medium">{assignedAnimals.length}</span>
              </div>
              
              {grazingMetrics?.entryDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fecha de Entrada</span>
                  <span className="text-sm">{formatDate(grazingMetrics.entryDate)}</span>
                </div>
              )}
              
              {grazingMetrics?.expectedExitDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fecha de Salida Sugerida</span>
                  <span className="font-medium text-orange-600">
                    {formatDate(grazingMetrics.expectedExitDate)}
                  </span>
                </div>
              )}
              
              {grazingMetrics?.daysInLot !== null && grazingMetrics?.daysInLot !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Días en Potrero</span>
                  <span className="text-sm">{grazingMetrics?.daysInLot || 0} días</span>
                </div>
              )}
              
              {lot.capacity && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Ocupación</span>
                    <span>{grazingMetrics?.occupancyPercentage || Math.round((assignedAnimals.length / lot.capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (grazingMetrics?.occupancyPercentage || 0) > 80 ? 'bg-red-500' :
                        (grazingMetrics?.occupancyPercentage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(grazingMetrics?.occupancyPercentage || (assignedAnimals.length / lot.capacity) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Animals List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-center">
                <Users className="w-5 h-5 mr-2" />
                Animales en el Lote ({assignedAnimals.length})
              </CardTitle>
              
              <div className="flex justify-center mt-4">
                <Button 
                  onClick={() => setShowAssignForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {assignedAnimals.length === 0 ? 'Asignar Primer Animal' : 'Agregar Más Animales'}
                </Button>
              </div>
              
              {/* Rest Period Information */}
              {grazingMetrics && (
                <div className="mt-4 space-y-2">
                  {grazingMetrics.lotStatus === 'resting' && grazingMetrics.nextAvailableDate && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-center text-amber-800">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Lote en Descanso</span>
                      </div>
                      <div className="mt-1 text-sm text-amber-700">
                        Disponible el: {formatDate(grazingMetrics.nextAvailableDate)}
                      </div>
                    </div>
                  )}
                  
                  {grazingMetrics.lotStatus === 'available' && lot.lastGrazingEndDate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center text-green-800">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Lote Disponible</span>
                      </div>
                      <div className="mt-1 text-sm text-green-700">
                        Última salida: {formatDate(lot.lastGrazingEndDate)} - Listo para recibir animales
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {assignedAnimals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay animales asignados a este lote</p>
                  <p className="text-sm mt-2">Use el botón "Asignar Primer Animal" para comenzar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedAnimals.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{assignment.animal?.name}</h4>
                          <p className="text-sm text-gray-600">Tag: {assignment.animal?.tag}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAnimal(assignment.animalId)}
                        >
                          Remover
                        </Button>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Especie:</span>
                          <span>{assignment.animal?.species}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Género:</span>
                          <span>{assignment.animal?.gender === 'male' ? 'Macho' : 'Hembra'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Asignado:</span>
                          <span>{new Date(assignment.assignedDate).toLocaleDateString('es-ES')}</span>
                        </div>
                        {grazingMetrics?.entryDate && grazingMetrics?.daysInLot !== null && grazingMetrics?.daysInLot !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Días en lote:</span>
                            <span>{grazingMetrics?.daysInLot || 0} días</span>
                          </div>
                        )}
                        {assignment.assignmentReason && (
                          <div className="mt-2">
                            <span className="text-gray-600 text-xs">Motivo: </span>
                            <span className="text-xs">{assignment.assignmentReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LotDetail;
