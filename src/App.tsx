
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import AnimalList from '@/pages/AnimalList';
import AnimalDetail from '@/pages/AnimalDetail';
import AnimalEdit from '@/pages/AnimalEdit';
import AnimalForm from '@/pages/AnimalForm';
import Breeding from '@/pages/Breeding';
import Calendar from '@/pages/Calendar';
import GmailCallback from '@/pages/GmailCallback';
import Reports from '@/pages/Reports';
import Lots from '@/pages/Lots';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import HealthRecords from '@/pages/HealthRecords';
import NotFound from '@/pages/NotFound';
import './App.css';
import AppErrorBoundary from '@/components/common/AppErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

function AppContent() {
  useDeepLinking();
  
  return (
    <div className="App">
      <AppErrorBoundary>
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
      </AppErrorBoundary>
              <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
