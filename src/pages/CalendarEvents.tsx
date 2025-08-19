import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, AlertTriangle, Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllEvents, getEventsByDateRange } from '@/services/calendarService';
import EventForm from '@/components/calendar/EventForm';
import ErrorBoundary from '@/components/ErrorBoundary';
import { applySEO } from '@/utils/seo';

const CalendarEvents = () => {
  const { toast } = useToast();
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  // SEO setup
  useEffect(() => {
    applySEO({
      title: 'Calendario — SKYRANCH',
      description: 'Gestión de eventos y programación de actividades veterinarias, apareamientos y tareas de manejo.',
      canonical: window.location.href
    });
  }, []);

  // Enhanced events fetching with timeout and fallback
  const { 
    data: events = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['calendar-events-enhanced'],
    queryFn: async () => {
      console.log('📅 CALENDAR: Fetching events...');
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Calendar query timeout')), 10000)
        );

        const eventsPromise = getAllEvents();
        const result = await Promise.race([eventsPromise, timeoutPromise]) as any[];
        
        console.log('📅 CALENDAR: Events fetched:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('📅 CALENDAR: Error fetching events:', error);
        return [];
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // Filter events based on search and tab
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const eventDate = new Date(event.event_date);
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return matchesSearch && eventDate >= now;
      case 'past':
        return matchesSearch && eventDate < now;
      case 'today':
        return matchesSearch && eventDate.toDateString() === now.toDateString();
      default:
        return matchesSearch;
    }
  });

  // Group events by type
  const eventsByType = filteredEvents.reduce((acc, event) => {
    const type = event.event_type || 'general';
    if (!acc[type]) acc[type] = [];
    acc[type].push(event);
    return acc;
  }, {} as Record<string, any[]>);

  const handleRefresh = async () => {
    console.log('🔄 CALENDAR: Manual refresh triggered');
    toast({
      title: "Actualizando",
      description: "Actualizando eventos del calendario...",
    });
    await refetch();
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'veterinary':
        return 'bg-red-500';
      case 'breeding':
        return 'bg-pink-500';
      case 'vaccination':
        return 'bg-blue-500';
      case 'feeding':
        return 'bg-green-500';
      case 'rotation':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'veterinary':
        return 'Veterinario';
      case 'breeding':
        return 'Apareamiento';
      case 'vaccination':
        return 'Vacunación';
      case 'feeding':
        return 'Alimentación';
      case 'rotation':
        return 'Rotación';
      default:
        return 'General';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Cargando Calendario</h3>
            <p className="text-muted-foreground mb-4">Obteniendo eventos programados...</p>
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
              <Calendar className="w-5 h-5" />
              Error al cargar calendario
            </CardTitle>
            <CardDescription>
              No se pudieron cargar los eventos del calendario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
              <Button onClick={() => setShowEventForm(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Crear Evento
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
            <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">
              Programa y gestiona eventos veterinarios y de manejo
            </p>
          </div>
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                Eventos programados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => new Date(e.event_date) >= new Date()).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Eventos pendientes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => 
                  new Date(e.event_date).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Eventos hoy
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(eventsByType).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Tipos de eventos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="past">Pasados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary" 
                            className={`${getEventTypeColor(event.event_type)} text-white`}
                          >
                            {getEventTypeText(event.event_type)}
                          </Badge>
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Calendar className="w-4 h-4" />
                              {formatEventDate(event.event_date)}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {(event.description || event.location || event.veterinarian) && (
                      <CardContent>
                        {event.description && (
                          <p className="text-muted-foreground mb-3">{event.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.veterinarian && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>Dr. {event.veterinarian}</span>
                            </div>
                          )}
                        </div>

                        {event.cost && (
                          <div className="mt-3 pt-3 border-t">
                            <span className="text-sm font-medium">
                              Costo estimado: ${event.cost}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'No se encontraron eventos' : 'No hay eventos programados'}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Comienza creando tu primer evento'
                    }
                  </p>
                  <Button onClick={() => setShowEventForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Evento
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Simple Event Form */}
        {showEventForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Crear Nuevo Evento</h3>
              <p className="text-muted-foreground mb-4">
                Función de calendario en desarrollo. Por ahora puedes cerrar este diálogo.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowEventForm(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CalendarEvents;