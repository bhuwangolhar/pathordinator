import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRefresh } from "../contexts/RefreshContext";
import UserDetailModal from "../components/UserDetailModal";

const API = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    online_status: boolean;
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

const formatUserId = (id: number): string => {
    return `USER-${String(id).padStart(4, '0')}`;
};

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { refreshCount } = useRefresh();
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("customer");
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            if (!currentUser || !currentUser.organization_id) {
                setUsers([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `${API}/organizations/${currentUser.organization_id}/users`
                );
                const data: UsersResponse = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to fetch users");
                }

                if (!isMounted) {
                    return;
                }

                setUsers(data.data || []);
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
    }, [currentUser, refreshCount]);

    const createUser = async () => {
        if (!currentUser || !currentUser.organization_id) {
            setError("Organization context missing");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(
                `${API}/organizations/${currentUser.organization_id}/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        role,
                        password: email.trim(), // Default password for now
                    }),
                }
            );
            const data: UserResponse = await res.json();

            if (!res.ok || !data.data) {
                throw new Error(data.message || "Failed to create user");
            }

            setUsers((currentUsers) => [...currentUsers, data.data as User]);
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

    const toggleUserStatus = async (userId: number, isCurrentlyActive: boolean) => {
        if (!currentUser || !currentUser.organization_id) {
            setError("Organization context missing");
            return;
        }

        setTogglingId(userId);
        setError(null);

        try {
            const endpoint = isCurrentlyActive ? "deactivate" : "activate";
            const res = await fetch(
                `${API}/organizations/${currentUser.organization_id}/users/${userId}/${endpoint}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const data: UserResponse = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Failed to ${endpoint} user`);
            }

            setUsers((currentUsers) =>
                currentUsers.map((u) =>
                    u.id === userId
                        ? { ...u, is_active: data.data?.is_active ?? !isCurrentlyActive }
                        : u
                )
            );
        } catch (err) {
            console.error(err);
            setError(
                err instanceof Error ? err.message : "Failed to update user status"
            );
        } finally {
            setTogglingId(null);
        }
    };

    const handleUserRowClick = (user: User) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleRefresh = () => {
        // Modal will trigger refresh via RefreshContext, users will reload due to refreshCount change
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
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                                <th style={{ width: "16%" }}>User ID</th>
                                <th style={{ width: "18%" }}>Identity</th>
                                <th style={{ width: "16%" }}>Account Status</th>
                                <th style={{ width: "16%" }}>Online Status</th>
                                <th style={{ width: "16%" }}>Role</th>
                                <th style={{ width: "18%" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="empty-row"><td colSpan={6}>Fetching records...</td></tr>
                            ) : users.length === 0 ? (
                                <tr className="empty-row"><td colSpan={6}>{error ? "Unable to load users" : "No users found"}</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} onClick={() => handleUserRowClick(u)} style={{ cursor: "pointer" }}>
                                    <td className="col-num">{formatUserId(u.id)}</td>
                                    <td>
                                        <div className="cell-name">{u.name}</div>
                                        <div className="cell-sub">{u.email}</div>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${u.is_active ? "active" : "inactive"}`}>
                                            <span className={`dot ${u.is_active ? "active" : "inactive"}`} />
                                            {u.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge-status ${u.online_status ? "active" : "inactive"}`}>
                                            <span className={`dot ${u.online_status ? "active" : "inactive"}`} />
                                            {u.online_status ? "Online" : "Offline"}
                                        </span>
                                    </td>
                                    <td><span className="badge-role">{u.role}</span></td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => toggleUserStatus(u.id, u.is_active)}
                                            disabled={togglingId === u.id || u.role === "admin"}
                                            className="action-btn"
                                            style={{
                                                background: u.is_active ? "#FEE2E2" : "#D1FAE5",
                                                color: u.is_active ? "#991B1B" : "#065F46",
                                                border: u.is_active ? "1px solid #FECACA" : "1px solid #A7F3D0",
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                cursor:
                                                    togglingId === u.id || u.role === "admin"
                                                        ? "not-allowed"
                                                        : "pointer",
                                                opacity:
                                                    togglingId === u.id || u.role === "admin"
                                                        ? 0.6
                                                        : 1,
                                            }}
                                            title={
                                                u.role === "admin"
                                                    ? "Cannot deactivate admin users"
                                                    : ""
                                            }
                                        >
                                            {togglingId === u.id
                                                ? "..."
                                                : u.is_active
                                                ? "Deactivate"
                                                : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && currentUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedUser(null);
                    }}
                    organizationId={currentUser.organization_id}
                    onRefresh={handleRefresh}
                />
            )}
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
  th { padding: 14px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.2px; }
  td { padding: 14px 16px; vertical-align: middle; font-size: 14px; color: #374151; border-bottom: 1px solid #F1F5F9; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr { transition: background .12s; }
  tbody tr:hover { background: #FAFBFF; }
  .col-num { color: #475569; font-weight: 600; font-size: 14px; white-space: nowrap; }
  .cell-name { font-weight: 600; color: #0F172A; font-size: 14px; margin-bottom: 2px; }
  .cell-sub { font-size: 12.5px; color: #94A3B8; }
  .badge-status { display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 6px; font-size: 12.5px; font-weight: 600; }
  .badge-status.active  { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
  .badge-status.inactive { background: #FFF7F7; color: #DC2626; border: 1px solid #FECACA; }
  .dot { position: relative; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot.active  { background: #22C55E; }
  .dot.inactive { background: #EF4444; }
  .badge-role { display: inline-block; padding: 4px 10px; border-radius: 5px; font-size: 12px; font-weight: 600; background: #F1F5F9; color: #475569; border: 1px solid #E2E8F0; text-transform: capitalize; }
  .action-btn { transition: all .2s; }
  .action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,.1); }
  .empty-row td { text-align: center; padding: 40px 16px; color: #94A3B8; font-size: 14px; }
`;
