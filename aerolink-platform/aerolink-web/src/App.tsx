import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './app/layouts/DashboardLayout';
import PassengerAppLayout from './app/layouts/PassengerAppLayout';

// Feature 10: Code splitting — lazy load all page components (not layouts)
const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const ExperiencePage = lazy(() => import('./features/landing/ExperiencePage'));
const PassengerPortal = lazy(() => import('./features/passenger/PassengerPortal'));
const FlightStatus = lazy(() => import('./features/flights/pages/FlightStatus'));
const OperationsDashboard = lazy(() => import('./features/operations/pages/OperationsDashboard'));
const GroundDashboard = lazy(() => import('./features/groundstaff/pages/GroundDashboard'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const SystemMetrics = lazy(() => import('./features/monitoring/pages/SystemMetrics'));

// Shared loading spinner
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LandingRoute() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'airline_operator') return <Navigate to="/operations" replace />;
    if (user?.role === 'ground_staff') return <Navigate to="/agent" replace />;
    // passengers remain on the landing page
  }
  return <LandingPage />;
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PassengerRoute() {
  const { user } = useAuth();
  return user?.role === 'passenger'
    ? <PassengerAppLayout><PassengerPortal /></PassengerAppLayout>
    : <DashboardLayout><PassengerPortal /></DashboardLayout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/flights/status" element={<FlightStatus />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/passenger" element={<ProtectedRoute><PassengerRoute /></ProtectedRoute>} />
        <Route path="/agent" element={<ProtectedRoute allowedRoles={['admin', 'ground_staff']}><DashboardLayout><GroundDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/operations" element={<ProtectedRoute allowedRoles={['admin', 'airline_operator']}><DashboardLayout><OperationsDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute allowedRoles={['admin', 'airline_operator', 'ground_staff']}><DashboardLayout><SystemMetrics /></DashboardLayout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
