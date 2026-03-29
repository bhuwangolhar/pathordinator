import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/users");
        const data = await res.json();
        const mapped = (data.data || []).map((u: User, i: number) => ({
          ...u,
          isActive: i % 2 === 0,
        }));
        setUsers(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <style>{pageStyles}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage and view all registered accounts</p>
        </div>
        {users.length > 0 && (
          <div className="header-count">{users.length} members</div>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th style={{ width: "35%" }}>Identity</th>
                <th style={{ width: "18%" }}>Status</th>
                <th style={{ width: "18%" }}>Role</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="empty-row"><td colSpan={5}>Fetching records…</td></tr>
              ) : users.length === 0 ? (
                <tr className="empty-row"><td colSpan={5}>No users found</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id}>
                  <td className="col-num">{i + 1}</td>
                  <td>
                    <div className="cell-name">{u.name}</div>
                    <div className="cell-sub">{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge-status ${u.isActive ? "active" : "inactive"}`}>
                      <span className={`dot ${u.isActive ? "active" : "inactive"}`} />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td><span className="badge-role">{u.role}</span></td>
                  <td className="col-uid">USR-{String(u.id).padStart(6, "0")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const pageStyles = `
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-title { font-size: 26px; font-weight: 700; color: #0F172A; letter-spacing: -0.4px; line-height: 1; }
  .page-subtitle { font-size: 13px; color: #94A3B8; margin-top: 6px; }
  .header-count { background: #EFF6FF; color: #2563EB; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border: 1px solid #DBEAFE; white-space: nowrap; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,.04); overflow: hidden; }
  .table-wrap { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
  th { padding: 12px 18px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.2px; white-space: nowrap; }
  td { padding: 16px 18px; vertical-align: middle; font-size: 14px; color: #374151; border-bottom: 1px solid #F1F5F9; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr { transition: background .12s; }
  tbody tr:hover { background: #FAFBFF; }
  .col-num { color: #CBD5E1; font-weight: 500; font-size: 13px; }
  .cell-name { font-weight: 600; color: #0F172A; font-size: 14px; margin-bottom: 2px; }
  .cell-sub { font-size: 12.5px; color: #94A3B8; }
  .col-uid { font-family: 'DM Mono', monospace; color: #94A3B8; font-size: 12.5px; }
  .badge-status { display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 6px; font-size: 12.5px; font-weight: 600; }
  .badge-status.active  { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
  .badge-status.inactive { background: #FFF7F7; color: #DC2626; border: 1px solid #FECACA; }
  .dot { position: relative; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot.active  { background: #22C55E; }
  .dot.inactive { background: #EF4444; }
  .badge-role { display: inline-block; padding: 4px 10px; border-radius: 5px; font-size: 12px; font-weight: 600; background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; text-transform: capitalize; }
  .empty-row td { text-align: center; padding: 60px 20px; color: #94A3B8; font-size: 14px; }
`;