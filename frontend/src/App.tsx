import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
};

function App() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8080/users");
      const data = await res.json();
      const usersWithStatus = (data.data || []).map((u: User, index: number) => ({
        ...u,
        isActive: index % 2 === 0,
      }));
      setUsers(usersWithStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ✅ THIS IS THE KEY FIX — #root must be full width */
        html, body, #root {
          width: 100%;
          min-height: 100vh;
          background: #F7F8FA;
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .layout {
          width: 100%;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 60px 24px;
          background: #F7F8FA;
        }

        .inner {
          width: 100%;
          max-width: 960px;
        }

        .header {
          margin-bottom: 24px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .brand-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563EB;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #2563EB;
        }

        .page-title {
          font-size: 26px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.4px;
          line-height: 1;
        }

        .page-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin-top: 6px;
          font-weight: 400;
        }

        .header-count {
          background: #EFF6FF;
          color: #2563EB;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #DBEAFE;
          white-space: nowrap;
          align-self: flex-start;
        }

        .card {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
          overflow: hidden;
          width: 100%;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        thead {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
        }

        th {
          padding: 13px 20px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          white-space: nowrap;
        }

        td {
          padding: 18px 20px;
          vertical-align: middle;
          font-size: 14px;
          color: #374151;
          border-bottom: 1px solid #F1F5F9;
        }

        tbody tr:last-child td { border-bottom: none; }
        tbody tr { transition: background 0.12s ease; }
        tbody tr:hover { background: #FAFBFF; }

        .col-num { color: #CBD5E1; font-weight: 500; font-size: 13px; }
        .user-name { font-weight: 600; color: #0F172A; font-size: 14px; margin-bottom: 3px; }
        .user-email { font-size: 12.5px; color: #94A3B8; font-weight: 400; }

        .badge-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 11px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
        }
        .badge-status.active  { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
        .badge-status.inactive { background: #FFF7F7; color: #DC2626; border: 1px solid #FECACA; }

        .dot {
          position: relative;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot.active  { background: #22C55E; }
        .dot.active::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid #22C55E;
          opacity: 0.35;
        }
        .dot.inactive { background: #EF4444; }
        .dot.inactive::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid #EF4444;
          opacity: 0.3;
        }

        .badge-role {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 600;
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
          text-transform: capitalize;
        }

        .col-uid {
          font-family: 'DM Mono', monospace;
          color: #94A3B8;
          font-size: 12.5px;
          letter-spacing: 0.3px;
        }

        .empty-row td {
          text-align: center;
          padding: 60px 20px;
          color: #94A3B8;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .layout { padding: 28px 16px; }
          th, td { padding: 14px 12px; }
          .header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
      `}</style>

      <div className="layout">
        <div className="inner">
          <header className="header">
            <div>
              <div className="brand">
                <span className="brand-dot" />
                <span className="brand-name">Pathordinator</span>
              </div>
              <h1 className="page-title">Users</h1>
              <p className="page-subtitle">Manage and view all registered accounts</p>
            </div>
            {users.length > 0 && (
              <div className="header-count">{users.length} members</div>
            )}
          </header>

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "56px" }}>#</th>
                    <th style={{ width: "34%" }}>Full Identity</th>
                    <th style={{ width: "18%" }}>Status</th>
                    <th style={{ width: "18%" }}>Role Level</th>
                    <th>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={5}>Fetching records…</td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={user.id}>
                        <td className="col-num">{index + 1}</td>
                        <td>
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </td>
                        <td>
                          <span className={`badge-status ${user.isActive ? "active" : "inactive"}`}>
                            <span className={`dot ${user.isActive ? "active" : "inactive"}`} />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <span className="badge-role">{user.role}</span>
                        </td>
                        <td className="col-uid">
                          USR-{String(user.id).padStart(6, "0")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
