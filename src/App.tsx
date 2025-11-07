import React, { Suspense, lazy, useEffect } from 'react';
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
import AcceptInvitation from '@/pages/AcceptInvitation';
import Dashboard from '@/pages/Dashboard';
import { logAppOpenOncePerSession } from '@/utils/connectionLogger';
import { createOptimizedQueryClient } from '@/utils/queryConfig';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
// AI Chat using drawer component with OpenAI integration
import ChatDrawer from '@/components/ai-chat/ChatDrawer';
import OfflineIndicator from '@/components/OfflineIndicator';
import { offlineStorage } from '@/services/offline/offlineStorage';
import { syncService } from '@/services/offline/syncService';
import { mobilePushService } from '@/services/mobile/pushNotificationService';
import { localNotificationService } from '@/services/mobile/localNotificationService';
import { SplashScreen } from '@capacitor/splash-screen';
import { calendarSyncService } from '@/services/mobile/calendarSyncService';
import { biometricStateManager } from '@/services/biometricStateManager';

// OPTIMIZED: Lazy load heavy pages for better initial bundle size
const AnimalList = lazy(() => import('@/pages/AnimalList'));
const SoldAnimals = lazy(() => import('@/pages/SoldAnimals'));
const AnimalDetail = lazy(() => import('@/pages/AnimalDetail'));
const AnimalEdit = lazy(() => import('@/pages/AnimalEdit'));
const AnimalForm = lazy(() => import('@/pages/AnimalForm'));
const Breeding = lazy(() => import('@/pages/Breeding'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Reports = lazy(() => import('@/pages/Reports'));
const Lots = lazy(() => import('@/pages/Lots'));
const HealthRecords = lazy(() => import('@/pages/HealthRecords'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));

// Keep lightweight pages eager-loaded
import GmailCallback from '@/pages/GmailCallback';
import NotFound from '@/pages/NotFound';
import './App.css';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';

// Create optimized query client with performance monitoring
const queryClient = createOptimizedQueryClient();

function AppContent() {
  useDeepLinking();
  const { user, loading } = useAuth();
  const { chatOpen, setChatOpen } = useAIChatDialog();

  // Initialize mobile services with proper sequencing
  useEffect(() => {
    const initServices = async () => {
      console.log('🚀 [App] Starting app initialization sequence...');
      
      // 1. Initialize offline storage first
      await offlineStorage.initialize();
      console.log('✅ [App] Offline storage initialized');

      // 2. Setup auto-sync
      syncService.setupAutoSync();
      console.log('✅ [App] Auto-sync enabled');

      // 3. Initialize biometric state manager (but don't block on it)
      if (Capacitor.isNativePlatform()) {
        biometricStateManager.checkStatus().catch(err => {
          console.error('⚠️  [App] Biometric check failed (non-blocking):', err);
        });
      }

      // 4. Initialize push and local notifications for authenticated users on native
      if (user && Capacitor.isNativePlatform()) {
        await mobilePushService.initialize();
        console.log('✅ [App] Push notifications initialized');
        
        await localNotificationService.initialize();
        console.log('✅ [App] Local notifications initialized');

        // 5. Start calendar sync AFTER user is authenticated
        calendarSyncService.startRealtimeSync();
        console.log('✅ [App] Calendar sync initialized');
      }

      console.log('🎉 [App] App initialization complete');
    };

    initServices();
  }, [user]);

  // App state management - handle foreground/background transitions
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let appStateListener: any;

    const setupAppStateListener = async () => {
      appStateListener = await CapacitorApp.addListener('appStateChange', async (state) => {
        if (state.isActive) {
          // App came to foreground
          console.log('📱 App resumed to foreground');
          
          // Resume sync
          syncService.resumeSync();
          
          // Update badge count
          await mobilePushService.updateBadgeCount();
          
          // TODO: Check if biometric auto-lock should trigger
        } else {
          // App went to background
          console.log('📱 App went to background');
          
          // Pause sync to save battery
          syncService.pauseSync();
        }
      });
    };

    setupAppStateListener();

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, []);

  // Log an "app_open" when a user has an active session (once per tab)
  useEffect(() => {
    if (!loading && user) {
      logAppOpenOncePerSession();
    }
  }, [loading, user]);

  // Hide splash screen after app is initialized
  useEffect(() => {
    const hideSplash = async () => {
      if (!loading) {
        // Ensure minimum splash time for branding
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hide();
      }
    };
    hideSplash();
  }, [loading]);
  
  return (
    <div className="App">
      <AppErrorBoundary>
        <Suspense fallback={<div className="p-6 text-center">Cargando…</div>}>
          <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
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
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
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
