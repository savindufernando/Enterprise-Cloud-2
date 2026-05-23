import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PassengerPortal from './features/passenger/PassengerPortal';
import OperationsDashboard from './features/operations/OperationsDashboard';
import AgentPortal from './features/agent/AgentPortal';
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

        {/* Operations — admin + airline_operator */}
        <Route
          path="/operations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'airline_operator']}>
              <OperationsDashboard />
            </ProtectedRoute>
          }
        />

        {/* Agent — admin + ground_staff */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['admin', 'ground_staff']}>
              <AgentPortal />
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
