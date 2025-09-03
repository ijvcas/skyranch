
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BreedingGoal {
  id: string;
  title: string;
  targetBreedings: number;
  currentBreedings: number;
  targetDate: string;
  species: string;
  description?: string;
}

const BreedingGoalsCard: React.FC = () => {
  const [goals, setGoals] = useState<BreedingGoal[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetBreedings: '',
    targetDate: '',
    species: '',
    description: ''
  });

  const handleCreateGoal = () => {
    if (newGoal.title && newGoal.targetBreedings && newGoal.targetDate) {
      const goal: BreedingGoal = {
        id: Date.now().toString(),
        title: newGoal.title,
        targetBreedings: parseInt(newGoal.targetBreedings),
        currentBreedings: 0,
        targetDate: newGoal.targetDate,
        species: newGoal.species,
        description: newGoal.description
      };
      
      setGoals([...goals, goal]);
      setNewGoal({ title: '', targetBreedings: '', targetDate: '', species: '', description: '' });
      setShowForm(false);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return target > 0 ? (current / target) * 100 : 0;
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle>Objetivos de Apareamiento</CardTitle>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título del Objetivo</Label>
                  <Input
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="Ej: Mejorar línea genética Holstein"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetBreedings">Meta de Apareamientos</Label>
                    <Input
                      id="targetBreedings"
                      type="number"
                      value={newGoal.targetBreedings}
                      onChange={(e) => setNewGoal({ ...newGoal, targetBreedings: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="species">Especie</Label>
                    <Select value={newGoal.species} onValueChange={(value) => setNewGoal({ ...newGoal, species: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bovino">Bovino</SelectItem>
                        <SelectItem value="equino">Equino</SelectItem>
                        <SelectItem value="porcino">Porcino</SelectItem>
                        <SelectItem value="caprino">Caprino</SelectItem>
                        <SelectItem value="ovino">Ovino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="targetDate">Fecha Meta</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Describe el objetivo y estrategia..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full">
                  Crear Objetivo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentBreedings, goal.targetBreedings);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{daysRemaining > 0 ? `${daysRemaining} días` : 'Vencido'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progreso: {goal.currentBreedings} / {goal.targetBreedings}</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {goal.description && (
                  <p className="text-sm text-gray-600">{goal.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 capitalize">Especie: {goal.species}</span>
                  <div className="flex items-center space-x-1 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">En progreso</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {goals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay objetivos definidos</p>
              <p className="text-sm">Crea tu primer objetivo de apareamiento</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BreedingGoalsCard;
