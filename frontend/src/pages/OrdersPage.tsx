import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const API = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  created:   { label: "Created",   cls: "s-created"   },
  assigned:  { label: "Assigned",  cls: "s-assigned"  },
  picked_up: { label: "Picked Up", cls: "s-picked"    },
  delivered: { label: "Delivered", cls: "s-delivered" },
};

type Customer = { id: number; name: string; email: string; role: string };

type Order = {
  id: number;
  customer_id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  customer?: Customer;
};

type FormState = {
  customer_id: string;
  pickup_address: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_address: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
};

export default function OrdersPage() {
  const { user: currentUser } = useAuth();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [users, setUsers]     = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    customer_id: "",
    pickup_address: "",
    pickup_latitude: null,
    pickup_longitude: null,
    delivery_address: "",
    delivery_latitude: null,
    delivery_longitude: null,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setAuthToken(localStorage.getItem("authToken"));
    fetchOrders();
    fetchUsers();
  }, [currentUser]);

  // Initialize auth token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
  }, [currentUser]);

  const getHeaders = () => {
    const token = authToken || localStorage.getItem('authToken');
    const headers: any = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/orders`, {
        headers: getHeaders()
      });
      const data = await res.json();
      setOrders(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser || !currentUser.organization_id) {
      setUsers([]);
      return;
    }

    try {
      const res = await fetch(
        `${API}/organizations/${currentUser.organization_id}/users`,
        { headers: getHeaders() }
      );
      const data = await res.json();
      // Filter to only show customers
      const customers = (data.data || []).filter((u: Customer) => u.role === 'customer');
      setUsers(customers);
    } catch (e) {
      console.error(e);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUsers();
  }, [currentUser]);

  const handleCreate = async () => {
    if (!form.customer_id || !form.pickup_address || !form.delivery_address) {
      setFormError("All fields are required.");
      return;
    }

    if (form.pickup_latitude === null || form.pickup_longitude === null) {
      setFormError("Please select a valid pickup location from the map.");
      return;
    }

    if (form.delivery_latitude === null || form.delivery_longitude === null) {
      setFormError("Please select a valid delivery location from the map.");
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          customer_id: Number(form.customer_id),
          pickup_address: form.pickup_address,
          pickup_latitude: form.pickup_latitude,
          pickup_longitude: form.pickup_longitude,
          delivery_address: form.delivery_address,
          delivery_latitude: form.delivery_latitude,
          delivery_longitude: form.delivery_longitude,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowModal(false);
      setForm({ 
        customer_id: "", 
        pickup_address: "", 
        pickup_latitude: null,
        pickup_longitude: null,
        delivery_address: "",
        delivery_latitude: null,
        delivery_longitude: null
      });
      await fetchOrders();
    } catch (e: any) {
      setFormError(e.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await fetch(`${API}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status } : o))
      );
    } catch (e) {
      console.error(e);
    }
  };



  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

  return (
    <>
      <style>{pageStyles}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and manage all delivery orders</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          {orders.length > 0 && (
            <div className="header-count">{orders.length} orders</div>
          )}
          <button className="btn-primary" onClick={() => { setShowModal(true); setFormError(""); }}>
            + New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th style={{ width: "14%" }}>Order ID</th>
                <th style={{ width: "20%" }}>Customer</th>
                <th style={{ width: "17%" }}>Status</th>
                <th style={{ width: "17%" }}>Pickup</th>
                <th style={{ width: "17%" }}>Delivery</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="empty-row"><td colSpan={7}>Fetching orders…</td></tr>
              ) : orders.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}>No orders yet — create one above</td></tr>
              ) : orders.map((o, i) => {
                const s = STATUS_LABELS[o.status] ?? { label: o.status, cls: "s-created" };
                return (
                  <tr key={o.id}>
                    <td className="col-num">{i + 1}</td>
                    <td className="col-uid">ORD-{String(o.id).padStart(5, "0")}</td>
                    <td>
                      <div className="cell-name">{o.customer?.name ?? `User #${o.customer_id}`}</div>
                      <div className="cell-sub">{o.customer?.email ?? ""}</div>
                    </td>
                    <td>
                      <select
                        className={`status-select ${s.cls}`}
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                      >
                        {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="addr-cell" title={o.pickup_address}>{o.pickup_address}</td>
                    <td className="addr-cell" title={o.delivery_address}>{o.delivery_address}</td>
                    <td className="date-cell">{fmtDate(o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Order</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label className="field-label">Customer</label>
                <select
                  className="field-input"
                  value={form.customer_id}
                  onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                >
                  <option value="">Select a customer…</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">Pickup Address</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Enter pickup address..."
                  value={form.pickup_address}
                  onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label className="field-label">Pickup Latitude</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.6139"
                    value={form.pickup_latitude !== null ? form.pickup_latitude : ''}
                    onChange={e => setForm(f => ({ ...f, pickup_latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Pickup Longitude</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.2090"
                    value={form.pickup_longitude !== null ? form.pickup_longitude : ''}
                    onChange={e => setForm(f => ({ ...f, pickup_longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Delivery Address</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Enter delivery address..."
                  value={form.delivery_address}
                  onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label className="field-label">Delivery Latitude</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.5355"
                    value={form.delivery_latitude !== null ? form.delivery_latitude : ''}
                    onChange={e => setForm(f => ({ ...f, delivery_latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Delivery Longitude</label>
                  <input
                    className="field-input"
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.3910"
                    value={form.delivery_longitude !== null ? form.delivery_longitude : ''}
                    onChange={e => setForm(f => ({ ...f, delivery_longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
              </div>

              {formError && <p className="field-error">{formError}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating…" : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

const pageStyles = `
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-title  { font-size: 26px; font-weight: 700; color: #0F172A; letter-spacing: -0.4px; line-height: 1; }
  .page-subtitle { font-size: 13px; color: #94A3B8; margin-top: 6px; }
  .header-count { background: #EFF6FF; color: #2563EB; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border: 1px solid #DBEAFE; white-space: nowrap; }

  .btn-primary { background: #2563EB; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .12s; }
  .btn-primary:hover { background: #1D4ED8; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: #64748B; border: 1px solid #E2E8F0; padding: 8px 16px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; font-family: inherit; transition: background .12s; }
  .btn-ghost:hover { background: #F8FAFC; }

  .card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,.04); overflow: hidden; }
  .table-wrap { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
  th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.2px; white-space: nowrap; }
  td { padding: 14px 16px; vertical-align: middle; font-size: 13.5px; color: #374151; border-bottom: 1px solid #F1F5F9; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr { transition: background .12s; }
  tbody tr:hover { background: #FAFBFF; }
  .col-num  { color: #CBD5E1; font-weight: 500; font-size: 13px; }
  .col-uid  { font-family: 'DM Mono', monospace; color: #94A3B8; font-size: 12.5px; }
  .cell-name { font-weight: 600; color: #0F172A; font-size: 13.5px; margin-bottom: 2px; }
  .cell-sub  { font-size: 12px; color: #94A3B8; }
  .addr-cell { font-size: 12.5px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 0; }
  .date-cell { font-size: 12.5px; color: #94A3B8; white-space: nowrap; }
  .empty-row td { text-align: center; padding: 60px 20px; color: #94A3B8; font-size: 14px; }

  .status-select {
    appearance: none; -webkit-appearance: none;
    border: none; outline: none; cursor: pointer;
    font-family: inherit; font-size: 12.5px; font-weight: 600;
    padding: 5px 10px; border-radius: 6px; border: 1px solid transparent;
    transition: opacity .12s;
  }
  .status-select:hover { opacity: 0.85; }
  .s-created   { background: #F1F5F9; color: #475569; border-color: #E2E8F0; }
  .s-assigned  { background: #EFF6FF; color: #2563EB; border-color: #DBEAFE; }
  .s-picked    { background: #FFFBEB; color: #D97706; border-color: #FDE68A; }
  .s-delivered { background: #F0FDF4; color: #16A34A; border-color: #BBF7D0; }

  /* Modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
  .modal { background: #fff; border-radius: 14px; border: 1px solid #E2E8F0; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,.12); }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #F1F5F9; }
  .modal-title  { font-size: 16px; font-weight: 700; color: #0F172A; }
  .modal-close  { background: none; border: none; font-size: 16px; color: #94A3B8; cursor: pointer; line-height: 1; padding: 2px 6px; border-radius: 4px; }
  .modal-close:hover { background: #F1F5F9; color: #475569; }
  .modal-body   { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .modal-footer { padding: 16px 24px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #F1F5F9; }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-size: 12.5px; font-weight: 600; color: #374151; }
  .field-input { padding: 9px 12px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: #0F172A; background: #F8FAFC; outline: none; transition: border-color .12s, background .12s; }
  .field-input:focus { border-color: #93C5FD; background: #fff; }
  .field-error { font-size: 12.5px; color: #DC2626; padding: 8px 12px; background: #FFF7F7; border: 1px solid #FECACA; border-radius: 6px; }
  .coords-display { font-size: 11px; color: #64748B; padding: 6px 8px; background: #F1F5F9; border-radius: 6px; font-family: 'DM Mono', monospace; margin-top: 4px; }
`;
