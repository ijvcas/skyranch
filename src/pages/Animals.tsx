import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Heart, Calendar, MapPin, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { getAllAnimals } from '@/services/animalService';
import { getAnimalsData } from '@/services/coreDataService';
import AnimalCard from '@/components/animals/AnimalCard';
import AddAnimalDialog from '@/components/animals/AddAnimalDialog';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applySEO } from '@/utils/seo';

const Animals = () => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');

  // SEO setup
  useEffect(() => {
    applySEO({
      title: 'Animales — SKYRANCH',
      description: 'Gestión completa de animales: registros, salud, genealogía y seguimiento en tiempo real.',
      canonical: window.location.href
    });
  }, []);

  // Enhanced animals fetching with core service
  const { 
    data: animals = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['animals-enhanced'],
    queryFn: async () => {
      console.log('🐄 ANIMALS: Fetching animals data...');
      try {
        const animalsData = await getAnimalsData();
        console.log('🐄 ANIMALS: Core service success:', animalsData?.length || 0);
        
        // Map to expected format
        return (animalsData || []).map(animal => ({
          id: animal.id,
          name: animal.name,
          tag: animal.tag || '',
          species: animal.species,
          breed: animal.breed || '',
          birthDate: animal.birth_date || '',
          gender: animal.gender || '',
          weight: animal.weight?.toString() || '',
          color: animal.color || '',
          healthStatus: animal.health_status || 'healthy',
          notes: animal.notes || '',
          image: animal.image_url,
          lifecycleStatus: animal.lifecycle_status || 'active',
          current_lot_id: animal.current_lot_id
        }));
      } catch (error) {
        console.error('🐄 ANIMALS: Core service failed, trying fallback');
        return await getAllAnimals();
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // Filter animals based on search and filters
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = speciesFilter === 'all' || animal.species === speciesFilter;
    const matchesHealth = healthFilter === 'all' || animal.healthStatus === healthFilter;
    
    return matchesSearch && matchesSpecies && matchesHealth;
  });

  // Get unique species for filter
  const uniqueSpecies = [...new Set(animals.map(animal => animal.species))];

  // Stats calculations
  const totalAnimals = animals.length;
  const healthyAnimals = animals.filter(a => a.healthStatus === 'healthy').length;
  const speciesCount = uniqueSpecies.length;

  const handleRefresh = async () => {
    console.log('🔄 ANIMALS: Manual refresh triggered');
    toast({
      title: "Actualizando",
      description: "Actualizando lista de animales...",
    });
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Cargando Animales</h3>
            <p className="text-muted-foreground mb-4">Obteniendo información de los animales...</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Heart className="w-5 h-5" />
              Error al cargar animales
            </CardTitle>
            <CardDescription>
              No se pudieron cargar los datos de los animales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={() => setShowAddDialog(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Animal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Animales</h1>
            <p className="text-muted-foreground">
              Gestiona y monitorea todos tus animales
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Animal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAnimals}</div>
              <p className="text-xs text-muted-foreground">
                Animales registrados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saludables</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthyAnimals}</div>
              <p className="text-xs text-muted-foreground">
                {totalAnimals > 0 ? Math.round((healthyAnimals / totalAnimals) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Especies</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{speciesCount}</div>
              <p className="text-xs text-muted-foreground">
                Diferentes especies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre o tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Especie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las especies</SelectItem>
                  {uniqueSpecies.map((species: string) => (
                    <SelectItem key={species} value={species}>
                      {species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={healthFilter} onValueChange={setHealthFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="healthy">Saludable</SelectItem>
                  <SelectItem value="sick">Enfermo</SelectItem>
                  <SelectItem value="injured">Herido</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Animals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAnimals.length > 0 ? (
            filteredAnimals.map((animal: any) => (
              <ErrorBoundary key={animal.id}>
                <AnimalCard animal={animal} />
              </ErrorBoundary>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm || speciesFilter !== 'all' || healthFilter !== 'all' 
                      ? 'No se encontraron animales' 
                      : 'No hay animales registrados'
                    }
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || speciesFilter !== 'all' || healthFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Comienza agregando tu primer animal'
                    }
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Animal
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Add Animal Dialog */}
        {showAddDialog && (
          <AddAnimalDialog
            isOpen={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSuccess={() => {
              refetch();
              toast({
                title: "Animal agregado",
                description: "El animal ha sido registrado exitosamente",
              });
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Animals;