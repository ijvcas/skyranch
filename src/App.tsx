import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AIChatProvider, useAIChatDialog } from '@/contexts/AIChatContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import { logAppOpenOncePerSession } from '@/utils/connectionLogger';
import { createOptimizedQueryClient } from '@/utils/queryConfig';
import ChatDrawer from '@/components/ai-chat/ChatDrawer';
const AnimalList = lazy(() => import('@/pages/AnimalList'));
const SoldAnimals = lazy(() => import('@/pages/SoldAnimals'));
import AnimalDetail from '@/pages/AnimalDetail';
import AnimalEdit from '@/pages/AnimalEdit';
import AnimalForm from '@/pages/AnimalForm';
import Breeding from '@/pages/Breeding';
import Calendar from '@/pages/Calendar';
import GmailCallback from '@/pages/GmailCallback';
import Reports from '@/pages/Reports';
const Lots = lazy(() => import('@/pages/Lots'));
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import HealthRecords from '@/pages/HealthRecords';
import NotFound from '@/pages/NotFound';
import './App.css';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';

// Create optimized query client with performance monitoring
const queryClient = createOptimizedQueryClient();

function AppContent() {
  useDeepLinking();
  const { user, loading } = useAuth();
  const { chatOpen, setChatOpen } = useAIChatDialog();

  // Log an "app_open" when a user has an active session (once per tab)
  React.useEffect(() => {
    if (!loading && user) {
      logAppOpenOncePerSession();
    }
  }, [loading, user]);
  
  return (
    <div className="App">
      <AppErrorBoundary>
        <Suspense fallback={<div className="p-6 text-center">Cargando…</div>}>
          <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/gmail/callback" element={<GmailCallback />} />
                  
                  <Route path="/" element={
                    <ProtectedRoute useCustomLayout={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute useCustomLayout={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/animals" element={
                    <ProtectedRoute>
                      <AnimalList />
                    </ProtectedRoute>
                  } />
                  <Route path="/animals/sold" element={
                    <ProtectedRoute>
                      <SoldAnimals />
                    </ProtectedRoute>
                  } />
                  <Route path="/animals/:id" element={
                    <ProtectedRoute>
                      <AnimalDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/animals/:id/edit" element={
                    <ProtectedRoute>
                      <AnimalEdit />
                    </ProtectedRoute>
                  } />
                  <Route path="/animals/new" element={
                    <ProtectedRoute>
                      <AnimalForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/breeding" element={
                    <ProtectedRoute>
                      <Breeding />
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="/lots" element={
                    <ProtectedRoute>
                      <Lots />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/health-records" element={
                    <ProtectedRoute>
                      <HealthRecords />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                 </Routes>
        </Suspense>
      </AppErrorBoundary>
              <Toaster />
      
      {/* AI Chat Drawer - Only show when logged in */}
      {user && <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AIChatProvider>
          <Router>
            <AppContent />
          </Router>
        </AIChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
