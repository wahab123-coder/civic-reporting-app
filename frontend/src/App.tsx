import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Auth
import LoginPage    from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Layouts
import CitizenLayout    from '@/components/layout/CitizenLayout';
import GovLayout        from '@/components/layout/GovLayout';
import ProtectedRoute   from '@/components/layout/ProtectedRoute';

// Citizen pages
import HomePage                from '@/pages/citizen/HomePage';
import CreateReportPage        from '@/pages/citizen/CreateReportPage';
import MyReportsPage           from '@/pages/citizen/MyReportsPage';
import CitizenReportDetailPage from '@/pages/citizen/ReportDetailPage';
import NotificationsPage       from '@/pages/citizen/NotificationsPage';
import AnnouncementsPage       from '@/pages/citizen/AnnouncementsPage';
import CitizenMapPage          from '@/pages/citizen/MapPage';
import ProfilePage             from '@/pages/citizen/ProfilePage';
import EmergencyPage           from '@/pages/citizen/EmergencyPage';

// Government pages
import AdminDashboard      from '@/pages/government/AdminDashboard';
import AdminComplaintsPage from '@/pages/government/AdminComplaintsPage';
import OfficerDashboard    from '@/pages/government/OfficerDashboard';
import OfficerProfile      from '@/pages/government/OfficerProfile';

// Shared
import NotFoundPage from '@/pages/NotFoundPage';

function RoleRedirect() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'citizen' || user.role === 'ngo')
    return <Navigate to="/citizen/home" replace />;
  return <Navigate to="/gov/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Root */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Public */}
      <Route path="/login"
        element={isAuthenticated ? <RoleRedirect /> : <LoginPage />} />
      <Route path="/register"
        element={isAuthenticated ? <RoleRedirect /> : <RegisterPage />} />

      {/* ── Citizen ── */}
      <Route element={<ProtectedRoute allowedRoles={['citizen','ngo']} />}>
        <Route element={<CitizenLayout />}>
          <Route path="/citizen/home"          element={<HomePage />} />
          <Route path="/citizen/report/new"    element={<CreateReportPage />} />
          <Route path="/citizen/my-reports"    element={<MyReportsPage />} />
          <Route path="/citizen/report/:id"    element={<CitizenReportDetailPage />} />
          <Route path="/citizen/notifications" element={<NotificationsPage />} />
          <Route path="/citizen/announcements" element={<AnnouncementsPage />} />
          <Route path="/citizen/map"           element={<CitizenMapPage />} />
          <Route path="/citizen/profile"       element={<ProfilePage />} />
          <Route path="/citizen/emergency"     element={<EmergencyPage />} />
        </Route>
      </Route>

      {/* ── Government / Admin ── */}
      <Route element={<ProtectedRoute allowedRoles={['admin','government_officer']} />}>
        <Route element={<GovLayout />}>
          {/* Dashboard — admin sees AdminDashboard, officers see OfficerDashboard */}
          <Route path="/gov/dashboard"
            element={user?.role === 'admin' ? <AdminDashboard /> : <OfficerDashboard />} />

          {/* Admin specific */}
          <Route path="/gov/complaints"    element={<AdminComplaintsPage />} />
          <Route path="/gov/assigned"      element={<OfficerDashboard />} />

          {/* Shared gov pages */}
          <Route path="/gov/map"           element={<CitizenMapPage />} />
          <Route path="/gov/analytics"     element={<AdminDashboard />} />
          <Route path="/gov/users"         element={<AdminDashboard />} />
          <Route path="/gov/departments"   element={<AdminDashboard />} />
          <Route path="/gov/notifications" element={<NotificationsPage />} />
          <Route path="/gov/report/:id"    element={<CitizenReportDetailPage />} />
          <Route path="/gov/profile"       element={<OfficerProfile />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
