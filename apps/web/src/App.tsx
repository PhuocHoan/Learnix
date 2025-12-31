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
import { LegacyLessonRedirect } from '@/pages/courses/legacy-lesson-redirect';

// Lazy load pages for code splitting
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/admin-dashboard-page'),
);
const AdminCoursesPage = lazy(() => import('@/pages/admin/admin-courses-page'));
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
const PrivacyPage = lazy(() => import('@/pages/legal/privacy-page'));
const TermsPage = lazy(() => import('@/pages/legal/terms-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'));
const BlockedPage = lazy(() => import('@/pages/auth/blocked-page'));

const InstructorCoursesPage = lazy(
  () => import('@/pages/instructor/instructor-courses-page'),
);
const CourseEditorPage = lazy(
  () => import('@/pages/instructor/course-editor-page'),
);
const QuizEditorPage = lazy(
  () => import('@/pages/instructor/quiz-editor-page'),
);
const CheckoutPage = lazy(() => import('@/pages/checkout/checkout-page'));

// Redirect component for legacy lesson URLs (from old notifications)

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
      <BrowserRouter>
        <AuthProvider>
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
              <Route path="/blocked" element={<BlockedPage />} />
              <Route
                path="/select-role"
                element={
                  <RoleSelectionGuard>
                    <SelectRolePage />
                  </RoleSelectionGuard>
                }
              />

              {/* Lesson Viewer - Full screen player mode without header/footer (like Udemy) */}
              <Route path="/courses/:id/learn" element={<LessonViewerPage />} />
              <Route
                path="/courses/:courseId/lessons/:lessonId"
                element={<LegacyLessonRedirect />}
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
                    <ProtectedRoute allowedRoles={['student', 'instructor']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-learning"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'instructor']}>
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
                <Route
                  path="/checkout/:courseId"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'instructor']}>
                      <CheckoutPage />
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
                  path="/admin/courses"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCoursesPage />
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
                  path="/instructor/courses"
                  element={
                    <ProtectedRoute allowedRoles={['instructor']}>
                      <InstructorCoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/new"
                  element={
                    <ProtectedRoute allowedRoles={['instructor']}>
                      <CourseEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/:courseId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['instructor']}>
                      <CourseEditorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/instructor/courses/:courseId/quizzes/:lessonId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['instructor']}>
                      <QuizEditorPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
