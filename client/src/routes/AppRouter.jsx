import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import LoaderPanel from "../components/common/LoaderPanel";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const CertificateVerificationPage = lazy(() => import("../pages/CertificateVerificationPage"));
const CertificatesPage = lazy(() => import("../pages/CertificatesPage"));
const EmergenciesPage = lazy(() => import("../pages/EmergenciesPage"));
const ComplaintPage = lazy(() => import("../pages/ComplaintPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const AnnouncementsPage = lazy(() => import("../pages/AnnouncementsPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const ResourcesPage = lazy(() => import("../pages/ResourcesPage"));
const VolunteersPage = lazy(() => import("../pages/VolunteersPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const UserManagementPage = lazy(() => import("../pages/UserManagementPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12"><LoaderPanel label="Loading workspace..." /></div>}>
        <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/verify" element={<CertificateVerificationPage />} />
        <Route path="/verify/certificate/:id" element={<CertificateVerificationPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/complaints" element={<ComplaintPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/emergencies" element={<EmergenciesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;
