import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { AuthCallbackPage } from '@/pages/auth/auth-callback-page';
import { SelectRolePage } from '@/pages/auth/select-role-page';
import { AdminDashboardPage } from '@/pages/admin/admin-dashboard-page';
import { UserManagementPage } from '@/pages/admin/user-management-page';
import { SystemStatsPage } from '@/pages/admin/system-stats-page';
import { QuizGeneratorPage } from '@/pages/instructor/quiz-generator-page';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/select-role" element={<SelectRolePage />} />
            
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/courses" element={<div>Courses Page</div>} />
              <Route path="/my-learning" element={<div>My Learning Page</div>} />
              <Route path="/settings" element={<div>Settings Page</div>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['admin']}><SystemStatsPage /></ProtectedRoute>} />
              
              {/* Instructor Routes */}
              <Route path="/instructor/quiz-generator" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><QuizGeneratorPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
