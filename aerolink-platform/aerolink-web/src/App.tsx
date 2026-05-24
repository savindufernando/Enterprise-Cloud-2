import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './features/landing/LandingPage';
import PassengerPortal from './features/passenger/PassengerPortal';
import OperationsDashboard from './features/operations/pages/OperationsDashboard';
import GroundDashboard from './features/groundstaff/pages/GroundDashboard';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import SystemMetrics from './features/monitoring/pages/SystemMetrics';
import DashboardLayout from './app/layouts/DashboardLayout';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Staff roles cannot visit "/" while logged in — redirect to their dashboard
function LandingRoute() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'airline_operator') return <Navigate to="/operations" replace />;
    if (user?.role === 'ground_staff') return <Navigate to="/agent" replace />;
    // passenger → allowed on landing page
  }
  return <LandingPage />;
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Landing page — blocked for logged-in staff, open for all others */}
        <Route path="/" element={<LandingRoute />} />

        {/* Passenger booking portal */}
        <Route
          path="/passenger"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PassengerPortal />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Ground Staff Desk */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['admin', 'ground_staff']}>
              <DashboardLayout>
                <GroundDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Flight Operations */}
        <Route
          path="/operations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'airline_operator']}>
              <DashboardLayout>
                <OperationsDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* System Administration Console */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Real-time Observability */}
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute allowedRoles={['admin', 'airline_operator', 'ground_staff']}>
              <DashboardLayout>
                <SystemMetrics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
