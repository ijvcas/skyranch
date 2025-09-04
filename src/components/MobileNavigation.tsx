
import React, { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  PlusCircle,
  FileText,
  Heart,
  Bell,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTouch } from '@/hooks/use-touch';
import NotificationBell from './NotificationBell';

const MobileNavigation = () => {
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouch();
  
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Panel' },
    { to: '/animals', icon: Users, label: 'Animales' },
    { to: '/lots', icon: MapPin, label: 'Lotes' },
    { to: '/breeding', icon: Heart, label: 'Reproducción' },
    { to: '/calendar', icon: Calendar, label: 'Calendario' },
  ];

  // Enhanced touch handler with haptic feedback
  const handleNavTouch = useCallback((event: React.TouchEvent) => {
    onTouchStart(event);
    // Add visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.transform = 'scale(0.95)';
    target.style.transition = 'transform 0.1s ease';
    
    // Provide haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10); // Very short vibration
    }
  }, [onTouchStart]);

  const handleNavTouchEnd = useCallback((event: React.TouchEvent) => {
    onTouchEnd();
    // Reset visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.transform = 'scale(1)';
    setTimeout(() => {
      target.style.transition = '';
    }, 100);
  }, [onTouchEnd]);

  return (
    <>
      {/* Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-14 safe-area-pt">
        <div className="flex justify-between items-center h-full px-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 min-w-0 mr-3 h-full">
            <img 
              src="/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" 
              alt="SkyRanch"
              className="h-8 w-8 flex-shrink-0"
              loading="lazy"
              decoding="async"
            />
            <span className="ml-3 text-base font-bold text-gray-900 whitespace-nowrap leading-none">SkyRanch</span>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0 h-full">
            <div className="flex items-center h-full">
              <NotificationBell />
            </div>
            <NavLink
              to="/animals/new"
              className="flex items-center px-2.5 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium h-8 mobile-tap-target"
            >
              <PlusCircle className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onTouchStart={handleNavTouch}
              onTouchEnd={handleNavTouchEnd}
              onTouchMove={onTouchMove}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center px-1 text-xs font-medium transition-all duration-150 h-full mobile-tap-target touch-manipulation',
                  'hover:bg-gray-50 active:bg-green-100',
                  isActive
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600'
                )
              }
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="truncate leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Floating Action Button for Notifications on Mobile */}
      <NavLink
        to="/notifications"
        className="md:hidden fixed bottom-20 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg z-40 flex items-center justify-center mobile-tap-target touch-manipulation"
      >
        <Bell className="w-6 h-6" />
      </NavLink>
    </>
  );
};

export default MobileNavigation;
