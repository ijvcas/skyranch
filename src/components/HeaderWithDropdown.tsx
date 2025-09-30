
import React from 'react';
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
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAIChatDialog } from '@/contexts/AIChatContext';
import { usePermissionCheck } from '@/hooks/usePermissions';
import NotificationBell from './NotificationBell';
import PWAInstallButton from './PWAInstallButton';
import aiIcon from '@/assets/ai-icon.png';

const HeaderWithDropdown = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { setChatOpen } = useAIChatDialog();
  const { hasAccess: canAccessSettings } = usePermissionCheck('system_settings');

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Panel' },
    { to: '/animals', icon: Users, label: 'Animales' },
    { to: '/lots', icon: MapPin, label: 'Lotes' },
    { to: '/breeding', icon: Heart, label: 'Reproducción' },
    { to: '/calendar', icon: Calendar, label: 'Calendario' },
    { to: '/reports', icon: FileText, label: 'Reportes' },
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
    ...(canAccessSettings ? [{ to: '/settings', icon: Settings, label: 'Configuración' }] : []),
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-green-100 border-b border-green-200 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 hover:bg-green-50 h-14 px-3">
                <img 
                  src="/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" 
                  alt="SkyRanch"
                  className="h-14 w-14 rounded flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900 whitespace-nowrap uppercase leading-none">SkyRanch</span>
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-64 bg-white border border-gray-200 shadow-lg z-50"
              sideOffset={8}
            >
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <NavLink
                    to={item.to}
                    className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer w-full"
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer w-full justify-start"
                >
                  <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                  Cerrar Sesión
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right side - AI Assistant, PWA install button and notification bell */}
          <div className="flex items-center space-x-3 h-full">
            <Button
              variant="ghost"
              onClick={() => setChatOpen(true)}
              className="h-14 w-14 p-2 hover:bg-green-50 rounded-lg transition-all"
              aria-label="Abrir asistente de IA"
            >
              <img 
                src={aiIcon} 
                alt="AI Assistant" 
                className="h-full w-full object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Button>
            <div className="flex items-center h-full">
              <PWAInstallButton />
            </div>
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
