
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  FileText,
  Heart,
  Bell,
  MapPin,
  ChevronDown,
  LogOut,
  X,
  DollarSign
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAIChatDialog } from '@/contexts/AIChatContext';
import { usePermissionCheck } from '@/hooks/usePermissions';
import { useFarmProfile } from '@/hooks/useFarmProfile';
import NotificationBell from './NotificationBell';
import { hapticService } from '@/services/mobile/hapticService';

const HeaderWithDropdown = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { setChatOpen } = useAIChatDialog();
  const { hasAccess: canAccessSettings } = usePermissionCheck('system_settings');
  const { data: farmProfile } = useFarmProfile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const farmName = farmProfile?.farm_name || 'FARMIKA';
  const farmLogo = farmProfile?.logo_url || '/farmika-logo.png';

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Panel' },
    { to: '/animals', icon: Users, label: 'Animales' },
    { to: '/lots', icon: MapPin, label: 'Lotes' },
    { to: '/breeding', icon: Heart, label: 'Reproducción' },
    { to: '/calendar', icon: Calendar, label: 'Calendario' },
    { to: '/finances', icon: DollarSign, label: 'Finanzas' },
    { to: '/reports', icon: FileText, label: 'Reportes' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
    ...(canAccessSettings ? [{ to: '/settings', icon: Settings, label: 'Configuración' }] : []),
  ];

  const handleSignOut = async () => {
    try {
      hapticService.heavy();
      setIsMenuOpen(false);
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = () => {
    hapticService.light();
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-green-100 border-b border-green-200 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo with Sheet Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center space-x-3 hover:bg-green-50 h-14 px-3 rounded-lg touch-manipulation active:scale-95 transition-transform"
                onTouchStart={(e) => {
                  // Prevent iOS click delay
                  e.currentTarget.style.opacity = '0.7';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <img 
                  src={farmLogo}
                  alt={farmName}
                  className="h-14 w-14 rounded flex-shrink-0 object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900 whitespace-nowrap uppercase leading-none">{farmName}</span>
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-600" />
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white p-0">
              <SheetHeader className="p-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-bold text-gray-900 uppercase">{farmName}</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              
              <nav className="flex flex-col p-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
                
                <div className="h-px bg-gray-200 my-4" />
                
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 justify-start rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                  Cerrar Sesión
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Right side - AI Assistant and notification bell */}
          <div className="flex items-center space-x-1 h-full pr-4 md:pr-3">
            <Button
              variant="ghost"
              onClick={() => setChatOpen(true)}
              className="h-12 w-12 p-1.5 hover:bg-green-50 rounded-lg transition-all"
              aria-label="Abrir asistente de IA"
            >
              <span className="text-3xl leading-none">🤖</span>
            </Button>
            <div className="flex items-center h-full">
              <NotificationBell />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderWithDropdown;
