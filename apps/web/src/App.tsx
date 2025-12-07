import { lazy, Suspense } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { GuestGuard } from '@/components/auth/guest-guard';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleSelectionGuard } from '@/components/auth/role-selection-guard';
import { AppShell } from '@/components/layout/app-shell';
import { ScrollToTop } from '@/components/scroll-to-top';
import { AuthProvider } from '@/contexts/auth-context';

// Lazy load pages for code splitting
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/admin-dashboard-page'),
);
const SystemStatsPage = lazy(() => import('@/pages/admin/system-stats-page'));
const UserManagementPage = lazy(
  () => import('@/pages/admin/user-management-page'),
);
const ActivatePage = lazy(() => import('@/pages/auth/activate-page'));
const AuthCallbackPage = lazy(() => import('@/pages/auth/auth-callback-page'));
const ForgotPasswordPage = lazy(
  () => import('@/pages/auth/forgot-password-page'),
);
const LoginPage = lazy(() => import('@/pages/auth/login-page'));
const RegisterPage = lazy(() => import('@/pages/auth/register-page'));
const ResetPasswordPage = lazy(
  () => import('@/pages/auth/reset-password-page'),
);
const SelectRolePage = lazy(() => import('@/pages/auth/select-role-page'));
const CourseDetailPage = lazy(
  () => import('@/pages/courses/course-detail-page'),
);
const CoursesPage = lazy(() => import('@/pages/courses/courses-page'));
const LessonViewerPage = lazy(
  () => import('@/pages/courses/lesson-viewer-page'),
);
const MyLearningPage = lazy(() => import('@/pages/courses/my-learning-page'));
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'));
const HomePage = lazy(() => import('@/pages/home/home-page'));
const QuizGeneratorPage = lazy(
  () => import('@/pages/instructor/quiz-generator-page'),
);
const PrivacyPage = lazy(() => import('@/pages/legal/privacy-page'));
const TermsPage = lazy(() => import('@/pages/legal/terms-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'));

const InstructorCoursesPage = lazy(
  () => import('@/pages/instructor/instructor-courses-page'),
);
const CourseEditorPage = lazy(
  () => import('@/pages/instructor/course-editor-page'),
);
const QuizEditorPage = lazy(
  () => import('@/pages/instructor/quiz-editor-page'),
);

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Guest-Only Routes (Redirect authenticated users) */}
              <Route
                path="/login"
                element={
                  <GuestGuard>
                    <LoginPage />
                  </GuestGuard>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestGuard>
                    <RegisterPage />
                  </GuestGuard>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <GuestGuard>
                    <ForgotPasswordPage />
                  </GuestGuard>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <GuestGuard>
                    <ResetPasswordPage />
                  </GuestGuard>
                }
              />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route
                path="/select-role"
                element={
                  <RoleSelectionGuard>
                    <SelectRolePage />
                  </RoleSelectionGuard>
                }
              />

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
                {/* Lesson Viewer - accessible to guests for preview lessons */}
                <Route
                  path="/courses/:id/learn"
                  element={<LessonViewerPage />}
                />
                <Route
                  path="/my-learning"
                  element={
                    <ProtectedRoute>
                      <MyLearningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stats"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SystemStatsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Instructor Protected Routes */}
                <Route
                  path="/instructor/quiz-generator"
                  element={
                    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                      <QuizGeneratorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses"
                  element={
                    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                      <InstructorCoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/new"
                  element={
                    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                      <CourseEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/:courseId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                      <CourseEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/:courseId/quizzes/:lessonId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                      <QuizEditorPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
