import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Skull } from 'lucide-react';
import { getSpeciesText } from '@/utils/animalSpecies';
import AnimalCard from './AnimalCard';
import type { Animal } from '@/stores/animalStore';
import { useVirtualizer } from '@tanstack/react-virtual';

interface AnimalSpeciesGroupProps {
  species: string;
  animals: Animal[];
  onDeleteAnimal: (animalId: string, animalName: string) => void;
  initialExpanded?: boolean;
}

const AnimalSpeciesGroup = ({ species, animals, onDeleteAnimal, initialExpanded = false }: AnimalSpeciesGroupProps) => {
  const [isCollapsed, setIsCollapsed] = useState(!initialExpanded);
  const [deceasedCollapsed, setDeceasedCollapsed] = useState(false);
  const parentRef = useRef<HTMLDivElement | null>(null);
  
  
  // Debug logging to see what animals are being passed to this component
  console.log(`AnimalSpeciesGroup for ${species} received ${animals.length} animals:`, animals.map(a => ({
    id: a.id,
    name: a.name,
    healthStatus: a.healthStatus,
    lifecycleStatus: a.lifecycleStatus
  })));
  
  // Separate active and deceased animals from the already filtered list
  const { activeAnimals, deceasedAnimals } = useMemo(() => {
    const active = animals.filter(animal => animal.lifecycleStatus !== 'deceased');
    const deceased = animals.filter(animal => animal.lifecycleStatus === 'deceased')
      .sort((a, b) => {
        // Sort deceased animals by date of death (most recent first)
        if (a.dateOfDeath && b.dateOfDeath) {
          return new Date(b.dateOfDeath).getTime() - new Date(a.dateOfDeath).getTime();
        }
        return 0;
      });
    
    console.log(`AnimalSpeciesGroup for ${species}: ${active.length} active, ${deceased.length} deceased`);
    return { activeAnimals: active, deceasedAnimals: deceased };
  }, [animals, species]);

  // Use virtualization for large lists (more than 30 animals)
  const shouldVirtualizeActive = activeAnimals.length > 30;
  const shouldVirtualizeDeceased = deceasedAnimals.length > 30;

  const activeVirtualizer = useVirtualizer({
    count: activeAnimals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 8,
  });

  const deceasedVirtualizer = useVirtualizer({
    count: deceasedAnimals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 8,
  });

  return (
    <Card className="shadow-lg">
      <Collapsible>
        <CollapsibleTrigger
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          <CardHeader className="hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center space-x-2">
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                <span>{getSpeciesText(species)}</span>
                {activeAnimals.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeAnimals.length} activos
                  </Badge>
                )}
                {deceasedAnimals.length > 0 && (
                  <Badge variant="outline" className="ml-1 text-gray-600 border-gray-300">
                    {deceasedAnimals.length} fallecidos
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {/* Active Animals Section */}
            {activeAnimals.length > 0 && (
              <div className="mb-6">
                {shouldVirtualizeActive ? (
                  <div ref={parentRef} className="max-h-[70vh] overflow-auto">
                    <div style={{ height: activeVirtualizer.getTotalSize(), position: 'relative' }}>
                      {activeVirtualizer.getVirtualItems().map((virtualRow) => {
                        const animal = activeAnimals[virtualRow.index];
                        return (
                          <div
                            key={virtualRow.key}
                            className="mb-4"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualRow.start}px)`
                            }}
                          >
                            <AnimalCard
                              animal={animal}
                              onDelete={onDeleteAnimal}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeAnimals.map((animal) => (
                      <AnimalCard
                        key={animal.id}
                        animal={animal}
                        onDelete={onDeleteAnimal}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deceased Animals Section */}
            {deceasedAnimals.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <Collapsible open={!deceasedCollapsed} onOpenChange={() => setDeceasedCollapsed(!deceasedCollapsed)}>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors mb-4"
                      onClick={() => setDeceasedCollapsed(!deceasedCollapsed)}
                    >
                      {deceasedCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <Skull className="h-4 w-4 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-700">Animales Fallecidos</span>
                      <Badge variant="outline" className="text-gray-600 border-gray-300">
                        {deceasedAnimals.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {shouldVirtualizeDeceased ? (
                      <div className="max-h-[50vh] overflow-auto">
                        <div style={{ height: deceasedVirtualizer.getTotalSize(), position: 'relative' }}>
                          {deceasedVirtualizer.getVirtualItems().map((virtualRow) => {
                            const animal = deceasedAnimals[virtualRow.index];
                            return (
                              <div
                                key={virtualRow.key}
                                className="mb-4"
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  transform: `translateY(${virtualRow.start}px)`
                                }}
                              >
                                <AnimalCard
                                  animal={animal}
                                  onDelete={onDeleteAnimal}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-gray-50 rounded-md p-4">
                        {deceasedAnimals.map((animal) => (
                          <AnimalCard
                            key={animal.id}
                            animal={animal}
                            onDelete={onDeleteAnimal}
                          />
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AnimalSpeciesGroup;