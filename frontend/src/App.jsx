import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResumeForm from "./pages/ResumeForm";
import ResumePreview from "./pages/ResumePreview";
import TemplateGallery from "./pages/TemplateGallery";
import AdminDashboard from "./pages/AdminDashboard";
import AdminResumePreview from "./pages/AdminResumePreview";


/* -------------------------------------------------------
   Professional application loading screen
------------------------------------------------------- */

function AppLoadingScreen({ message = "Preparing your workspace..." }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="page-loading-background">
        <div className="loading-orb loading-orb-one" />
        <div className="loading-orb loading-orb-two" />
      </div>

      <div className="page-loading-content">

        {/* Brand */}
        <div className="page-loading-brand">
          <div className="page-loading-logo">
            R
          </div>

          <div className="page-loading-brand-name">
            Resume<span>Forge</span>
          </div>
        </div>

        {/* Loading card */}
        <div className="page-loading-card">

          <div className="professional-loader">
            <div className="loader-ring" />
            <div className="loader-logo">
              R
            </div>
          </div>

          <div className="page-loading-text">
            <h2>{message}</h2>
            <p>
              We're getting everything ready for you
            </p>
          </div>

          <div className="loading-progress">
            <span />
          </div>

        </div>

        <div className="page-loading-footer">
          Build a resume you're proud of.
        </div>

      </div>
    </div>
  );
}


/* -------------------------------------------------------
   Admin protected route
------------------------------------------------------- */

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLoadingScreen message="Checking your account..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


/* -------------------------------------------------------
   User-only route
------------------------------------------------------- */

function UserOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLoadingScreen message="Checking your account..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}


/* -------------------------------------------------------
   Main application
------------------------------------------------------- */

function App() {
  return (
    <AuthProvider>

      <Routes>

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/resumes/:id"
          element={
            <AdminRoute>
              <AdminResumePreview />
            </AdminRoute>
          }
        />


        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* Profile */}
        <Route
          path="/profile"
          element={
            <UserOnlyRoute>
              <Profile />
            </UserOnlyRoute>
          }
        />


        {/* Template gallery */}
        <Route
          path="/resumes/:id/template"
          element={
            <ProtectedRoute>
              <TemplateGallery />
            </ProtectedRoute>
          }
        />


        {/* Resume editor */}
        <Route
          path="/resumes/:id/edit"
          element={
            <ProtectedRoute>
              <ResumeForm />
            </ProtectedRoute>
          }
        />


        {/* Resume preview */}
        <Route
          path="/resumes/:id/preview"
          element={
            <ProtectedRoute>
              <ResumePreview />
            </ProtectedRoute>
          }
        />


        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </AuthProvider>
  );
}

export default App;
