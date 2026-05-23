import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PassengerPortal from './features/passenger/PassengerPortal';
import OperationsDashboard from './features/operations/pages/OperationsDashboard';
import GroundDashboard from './features/groundstaff/pages/GroundDashboard';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import SystemMetrics from './features/monitoring/pages/SystemMetrics';
import LoginPage from './features/auth/LoginPage';
import DashboardLayout from './app/layouts/DashboardLayout';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        {/* Passenger — any authenticated user */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <PassengerPortal />
            </ProtectedRoute>
          } 
        />

        {/* Ground Staff Desk — admin + ground_staff */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['admin', 'ground_staff']}>
              <GroundDashboard />
            </ProtectedRoute>
          }
        />

        {/* Flight Operations — admin + airline_operator */}
        <Route
          path="/operations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'airline_operator']}>
              <OperationsDashboard />
            </ProtectedRoute>
          }
        />

        {/* System Administration Console — admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Real-time Observability & Telemetry — admin + airline_operator + ground_staff */}
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute allowedRoles={['admin', 'airline_operator', 'ground_staff']}>
              <SystemMetrics />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
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
