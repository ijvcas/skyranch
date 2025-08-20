
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Settings, PlusCircle } from 'lucide-react';
import { usePermissionCheck } from '@/hooks/usePermissions';

const DashboardQuickActions = () => {
  const navigate = useNavigate();
  const { hasAccess: canAccessSettings } = usePermissionCheck('system_settings');

  const quickActions = [
    { 
      title: 'Ver Animales', 
      description: 'Gestionar animales existentes',
      icon: Users,
      action: () => navigate('/animals'),
      color: 'bg-blue-600 hover:bg-blue-700',
      showAddButton: true
    },
    { 
      title: 'Calendario', 
      description: 'Programar eventos y citas',
      icon: Calendar,
      action: () => navigate('/calendar'),
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    ...(canAccessSettings ? [{ 
      title: 'Configuración', 
      description: 'Ajustes del sistema',
      icon: Settings,
      action: () => navigate('/settings'),
      color: 'bg-gray-600 hover:bg-gray-700'
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 relative">
            <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg ${action.color} flex items-center justify-center mb-3 md:mb-4 shadow-md`}>
                <action.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <CardTitle className="text-lg md:text-2xl font-semibold text-gray-900 leading-tight">
                {action.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-4 md:p-6">
              <p className="text-gray-600 text-sm md:text-lg mb-4 md:mb-6 leading-relaxed">{action.description}</p>
              <div className="flex gap-2">
                <Button 
                  onClick={action.action}
                  className={`flex-1 h-10 md:h-12 text-sm md:text-base font-semibold ${action.color} text-white transition-colors duration-200 mobile-tap-target`}
                >
                  Acceder
                </Button>
                {action.showAddButton && (
                  <Button
                    onClick={() => navigate('/animals/new')}
                    className="h-10 md:h-12 px-3 md:px-4 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 mobile-tap-target"
                    title="Agregar nuevo animal"
                  >
                    <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
