import { useEffect, useState } from "react";

const API = "http://localhost:8080";

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive?: boolean;
};

type UsersResponse = {
    success: boolean;
    message?: string;
    data?: User[];
};

type UserResponse = {
    success: boolean;
    message?: string;
    data?: User;
};

function withDisplayStatus(records: User[]) {
    return records.map((user, index) => ({
        ...user,
        isActive: index % 2 === 0,
    }));
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("customer");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${API}/users`);
                const data: UsersResponse = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to fetch users");
                }

                if (!isMounted) {
                    return;
                }

                setUsers(withDisplayStatus(data.data || []));
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                console.error(err);
                setUsers([]);
                setError(err instanceof Error ? err.message : "Failed to fetch users");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    const createUser = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    role,
                }),
            });
            const data: UserResponse = await res.json();

            if (!res.ok || !data.data) {
                throw new Error(data.message || "Failed to create user");
            }

            setUsers((currentUsers) => withDisplayStatus([...currentUsers, data.data as User]));
            setName("");
            setEmail("");
            setRole("customer");
            setShowForm(false);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const isCreateDisabled = submitting || !name.trim() || !email.trim();

    return (
        <>
            <style>{pageStyles}</style>

            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage and view all registered accounts</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {users.length > 0 && (
                        <div className="header-count">{users.length} members</div>
                    )}

                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            background: "#2563EB",
                            color: "white",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600
                        }}
                    >
                        + New User
                    </button>
                </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {showForm && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "16px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        background: "#fff"
                    }}
                >
                    <h3 style={{ marginBottom: "10px" }}>Create User</h3>

                    <input
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ marginRight: "10px", padding: "6px" }}
                    />

                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ marginRight: "10px", padding: "6px" }}
                    />

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ marginRight: "10px", padding: "6px" }}
                    >
                        <option value="customer">Customer</option>
                        <option value="delivery_partner">Delivery Partner</option>
                        <option value="admin">Admin</option>
                    </select>

                    <button disabled={isCreateDisabled} onClick={createUser} style={{ marginRight: "8px" }}>
                        {submitting ? "Creating..." : "Create"}
                    </button>

                    <button disabled={submitting} onClick={() => setShowForm(false)}>
                        Cancel
                    </button>
                </div>
            )}

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
                                <tr className="empty-row"><td colSpan={5}>Fetching records...</td></tr>
                            ) : users.length === 0 ? (
                                <tr className="empty-row"><td colSpan={5}>{error ? "Unable to load users" : "No users found"}</td></tr>
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
  .error-banner { margin-bottom: 20px; padding: 12px 14px; border-radius: 10px; background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; font-size: 13px; font-weight: 600; }
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
