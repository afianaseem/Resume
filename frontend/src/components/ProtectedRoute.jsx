import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingScreen({ message = "Preparing your workspace..." }) {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <div className="page-loading-background">
        <div className="loading-orb loading-orb-one" />
        <div className="loading-orb loading-orb-two" />
      </div>

      <div className="page-loading-content">
        <div className="page-loading-brand">
          <div className="page-loading-logo">R</div>

          <div className="page-loading-brand-name">
            Resume<span>Forge</span>
          </div>
        </div>

        <div className="page-loading-card">
          <div className="professional-loader">
            <div className="loader-ring" />
            <div className="loader-logo">R</div>
          </div>

          <div className="page-loading-text">
            <h2>{message}</h2>
            <p>Please wait a moment</p>
          </div>

          <div className="loading-progress">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
