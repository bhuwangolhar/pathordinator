import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import UsersPage from "./pages/UsersPage";
import OrdersPage from "./pages/OrdersPage";
import DeliverySessionsPage from "./pages/DeliverySessionsPage";
import TrackingPage from "./pages/TrackingPage";

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

        .sidebar-brand-icon {
          width: 28px;
          height: 28px;
          background: #2563EB;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-brand-icon svg {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: #fff;
          stroke-width: 2;
          stroke-linecap: round;
        }

        .sidebar-brand-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #0F172A;
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
          .sidebar-brand { border-bottom: none; padding-bottom: 0; }
          .sidebar-label { display: none; }
          .nav-link { border-left: none; border-bottom: 2px solid transparent; }
          .nav-link.active { border-left-color: transparent; border-bottom-color: #2563EB; }
          .main { padding: 24px 16px; }
        }
      `}</style>

      <BrowserRouter>
        <div className="shell">
          <aside className="sidebar">
            <div className="sidebar-brand">
              <div className="sidebar-brand-icon">
                <svg viewBox="0 0 14 14">
                  <path d="M2 7h10M7 2l5 5-5 5" />
                </svg>
              </div>
              <span className="sidebar-brand-name">Pathordinator</span>
            </div>

            <p className="sidebar-label">Navigation</p>

            <NavLink to="/users" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              Users
            </NavLink>

            <NavLink to="/orders" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M8 8h5M8 16h6" />
              </svg>
              Orders
            </NavLink>

            <NavLink to="/sessions" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
              </svg>
              Sessions
            </NavLink>

            <NavLink to="/tracking" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Tracking
            </NavLink>

          </aside>

          <main className="main">
            <Routes>
              <Route path="/" element={<Navigate to="/users" replace />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/sessions" element={<DeliverySessionsPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </>
  );
}