
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import HeaderWithDropdown from '@/components/HeaderWithDropdown';

interface ProtectedRouteProps {
  children: React.ReactNode;
  useCustomLayout?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, useCustomLayout = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Cargando aplicación...</div>
          <div className="text-sm text-muted-foreground mt-2">Usuario: {user?.email || 'Verificando...'}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If using custom layout, don't apply default padding and background
  if (useCustomLayout) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderWithDropdown />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderWithDropdown />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default ProtectedRoute;
