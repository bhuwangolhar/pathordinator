import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { RefreshProvider } from "./contexts/RefreshContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UsersPage from "./pages/UsersPage";
import OrdersPage from "./pages/OrdersPage";
import DeliverySessionsPage from "./pages/DeliverySessionsPage";
import TrackingPage from "./pages/TrackingPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function Dashboard({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user, logout } = useAuth();

  const handleNavClick = (path: string) => {
    onNavigate?.(path);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">Pathordinator</span>
        </div>

        <NavLink to="/dashboard/users" onClick={() => handleNavClick('users')} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Users
        </NavLink>

        <NavLink to="/dashboard/orders" onClick={() => handleNavClick('orders')} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 12h8M8 8h5M8 16h6" />
          </svg>
          Orders
        </NavLink>

        <NavLink to="/dashboard/sessions" onClick={() => handleNavClick('sessions')} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          </svg>
          Sessions
        </NavLink>

        <NavLink to="/dashboard/tracking" onClick={() => handleNavClick('tracking')} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          Tracking
        </NavLink>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-org">{user?.organization?.name}</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  const getDefaultDashboardPath = () => {
    if (!isAuthenticated) return 'users';
    const lastPath = localStorage.getItem('lastDashboardPath');
    return lastPath || 'users';
  };

  const handleDashboardNavigate = (path: string) => {
    localStorage.setItem('lastDashboardPath', path);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onNavigate={handleDashboardNavigate} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={getDefaultDashboardPath()} replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="sessions" element={<DeliverySessionsPage />} />
          <Route path="tracking" element={<TrackingPage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root {
          width: 100%;
          min-height: 100vh;
          background: #F7F8FA;
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .shell {
          display: flex;
          min-height: 100vh;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          padding: 28px 0 20px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px 28px;
          border-bottom: 1px solid #F1F5F9;
        }

        .sidebar-brand-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #2563EB;
        }

        .sidebar-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #94A3B8;
          padding: 20px 20px 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px;
          font-size: 13.5px;
          font-weight: 500;
          color: #64748B;
          text-decoration: none;
          border-radius: 0;
          transition: background 0.12s, color 0.12s;
          border-left: 2px solid transparent;
        }

        .nav-link:hover { background: #F8FAFC; color: #0F172A; }

        .nav-link.active {
          background: #EFF6FF;
          color: #2563EB;
          border-left-color: #2563EB;
          font-weight: 600;
        }

        .nav-link svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          opacity: 0.7;
        }

        .nav-link.active svg { opacity: 1; }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px 20px;
          border-top: 1px solid #F1F5F9;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .user-details {
          min-width: 0;
          flex: 1;
        }

        .user-name {
          font-size: 12px;
          font-weight: 600;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-org {
          font-size: 11px;
          color: #94A3B8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E2E8F0;
          background: white;
          color: #EF4444;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .logout-btn:hover {
          background: #FEE2E2;
          border-color: #FECACA;
        }

        /* ── Main content ── */
        .main {
          flex: 1;
          min-width: 0;
          padding: 48px 40px;
          background: #F7F8FA;
        }

        @media (max-width: 768px) {
          .shell { flex-direction: column; }
          .sidebar { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; padding: 12px; border-right: none; border-bottom: 1px solid #E2E8F0; }
          .sidebar-brand { border-bottom: none; padding: 0; margin-right: auto; }
          .sidebar-label { display: none; }
          .nav-link { border-left: none; border-bottom: 2px solid transparent; }
          .nav-link.active { border-left-color: transparent; border-bottom-color: #2563EB; }
          .main { padding: 24px 16px; }
          .sidebar-footer { position: absolute; bottom: 0; right: 0; width: auto; }
        }
      `}</style>

      <AuthProvider>
        <WebSocketProvider>
          <RefreshProvider>
            <AppContent />
          </RefreshProvider>
        </WebSocketProvider>
      </AuthProvider>
    </>
  );
}