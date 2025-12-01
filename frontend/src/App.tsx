import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { AuthCallbackPage } from "@/pages/auth/auth-callback-page";
import { SelectRolePage } from "@/pages/auth/select-role-page";
import { AdminDashboardPage } from "@/pages/admin/admin-dashboard-page";
import { UserManagementPage } from "@/pages/admin/user-management-page";
import { SystemStatsPage } from "@/pages/admin/system-stats-page";
import { QuizGeneratorPage } from "@/pages/instructor/quiz-generator-page";
import { CoursesPage } from "@/pages/courses/courses-page";
import { CourseDetailPage } from "@/pages/courses/course-detail-page";
import { LessonViewerPage } from "@/pages/courses/lesson-viewer-page";
import { HomePage } from "@/pages/home/home-page";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes (Standalone) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/select-role" element={<SelectRolePage />} />

            {/* Layout Routes (Includes Sidebar & Header) */}
            <Route element={<AppShell />}>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id/learn"
                element={
                  <ProtectedRoute>
                    <LessonViewerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-learning"
                element={
                  <ProtectedRoute>
                    <div>My Learning Page</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <div>Settings Page</div>
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stats"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SystemStatsPage />
                  </ProtectedRoute>
                }
              />

              {/* Instructor Protected Routes */}
              <Route
                path="/instructor/quiz-generator"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <QuizGeneratorPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
