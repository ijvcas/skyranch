import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Bell, MapPin, RotateCcw, MessageCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Capacitor } from '@capacitor/core';

const MobileSettings: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    return (
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          Estas funciones solo están disponibles en la aplicación móvil nativa (iOS/Android).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Funciones Móviles Implementadas
          </CardTitle>
          <CardDescription>
            Características nativas de iOS integradas en FARMIKA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <FeatureItem
              icon={<Bell className="w-4 h-4" />}
              title="Notificaciones Push"
              description="Recibe alertas importantes sobre tus animales y eventos"
              status="Activo"
            />
            
            <FeatureItem
              icon={<Bell className="w-4 h-4" />}
              title="Recordatorios Locales"
              description="Programa recordatorios para vacunaciones, partos y eventos"
              status="Activo"
            />
            
            <FeatureItem
              icon={<MapPin className="w-4 h-4" />}
              title="Geolocalización"
              description="Guarda la ubicación GPS de animales y eventos en el campo"
              status="Activo"
            />
            
            <FeatureItem
              icon={<RotateCcw className="w-4 h-4" />}
              title="Sincronización Automática"
              description="Sincroniza datos automáticamente al conectarse a internet"
              status="Activo"
            />
            
            <FeatureItem
              icon={<MessageCircle className="w-4 h-4" />}
              title="Compartir Información"
              description="Comparte registros de animales y reportes vía AirDrop, WhatsApp o email"
              status="Activo"
            />
            
            <FeatureItem
              icon={<Calendar className="w-4 h-4" />}
              title="Integración con iOS"
              description="Menús nativos, hojas de acción y feedback háptico"
              status="Activo"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Funciones adicionales en desarrollo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureItem
            icon={<MessageCircle className="w-4 h-4" />}
            title="Contactos"
            description="Acceso rápido a veterinarios y compradores desde tus contactos"
            status="En desarrollo"
          />
          
          <FeatureItem
            icon={<Calendar className="w-4 h-4" />}
            title="Calendario iOS"
            description="Sincronización bidireccional con el Calendario de iOS"
            status="En desarrollo"
          />
        </CardContent>
      </Card>
    </div>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, status }) => {
  const statusColor = status === 'Activo' ? 'text-green-600' : 'text-orange-600';
  
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{title}</p>
          <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default MobileSettings;
