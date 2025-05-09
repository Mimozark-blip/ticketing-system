import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Suspense, lazy, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages
const LoginPage = lazy(() => import("./pages/Login"));
const SignUpPage = lazy(() => import("./pages/Register"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminReport = lazy(() => import("./pages/AdminReport"));
const AdminFeedback = lazy(() => import("./pages/AdminFeedback"));
const ITStaffDashboard = lazy(() => import("./pages/ITStaffDashboard"));
const ITStaffReport = lazy(() => import("./pages/ITStaffReport"));
// const TicketDashboard = lazy(() => import("./pages/TicketDashboard"));
const ManageUserDashboard = lazy(() => import("./pages/ManageUserDashboard"));

// ✅ Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="border-gray-300 h-20 w-20 animate-spin rounded-full border-8 border-t-black"></div>
  </div>
);

// ✅ Protected Route Component
// Enhanced Protected Route with navigation blocking
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  // const navigate = useNavigate();

  useEffect(() => {
    // Prevent back navigation
    window.history.pushState(null, null, window.location.pathname);
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Block navigation when user tries to use browser navigation
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!user) return;
      event.preventDefault();
      return (event.returnValue = "");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
              replace
            />

            {/* <Route
              path="/ticket-dashboard"
              element={
                <ProtectedRoute>
                  <TicketDashboard />
                </ProtectedRoute>
              }
            /> */}

            {/* IT Staff Routes */}
            <Route
              path="/it-staff-dashboard"
              element={
                <ProtectedRoute>
                  <ITStaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/it-staff-report"
              element={
                <ProtectedRoute>
                  <ITStaffReport />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manage-users"
              element={
                <ProtectedRoute>
                  <ManageUserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-reports"
              element={
                <ProtectedRoute>
                  <AdminReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-feedback"
              element={
                <ProtectedRoute>
                  <AdminFeedback />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
