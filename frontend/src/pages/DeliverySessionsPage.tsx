import { useEffect, useState } from "react";

const API = "http://localhost:8080";

type Session = {
  id: number;
  order_id: number;
  delivery_partner_id: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  deliveryPartner?: { id: number; name: string; email: string };
  order?: { id: number; status: string; pickup_address: string; delivery_address: string };
};

type Order  = { id: number; status: string; pickup_address: string };
type User   = { id: number; name: string; email: string; role: string };

export default function DeliverySessionsPage() {
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [orders, setOrders]         = useState<Order[]>([]);
  const [partners, setPartners]     = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding]         = useState<number | null>(null);
  const [form, setForm]             = useState({ order_id: "", delivery_partner_id: "" });
  const [formError, setFormError]   = useState("");

  const fetchSessions = async () => {
    // fetch sessions for all orders by fetching each order's session
    // Since there's no GET /delivery-sessions, we load per-order
    // We instead call /delivery-sessions/order/:id for each order
    try {
      const ordRes  = await fetch(`${API}/orders`);
      const ordData = await ordRes.json();
      const allOrders: Order[] = ordData.data || [];

      const settled = await Promise.allSettled(
        allOrders.map(o =>
          fetch(`${API}/delivery-sessions/order/${o.id}`).then(r => r.json())
        )
      );

      const found: Session[] = [];
      settled.forEach(r => {
        if (r.status === "fulfilled" && r.value.success) found.push(r.value.data);
      });
      setSessions(found);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    const [ordRes, usrRes] = await Promise.all([
      fetch(`${API}/orders`).then(r => r.json()),
      fetch(`${API}/users`).then(r => r.json()),
    ]);
    setOrders(ordRes.data || []);
    setPartners((usrRes.data || []).filter((u: User) => u.role === "delivery_partner"));
  };

  useEffect(() => { fetchSessions(); fetchDropdowns(); }, []);

  const handleStart = async () => {
    if (!form.order_id || !form.delivery_partner_id) {
      setFormError("Both fields are required."); return;
    }
    setFormError(""); setSubmitting(true);
    try {
      const res  = await fetch(`${API}/delivery-sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: Number(form.order_id),
          delivery_partner_id: Number(form.delivery_partner_id)
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowModal(false);
      setForm({ order_id: "", delivery_partner_id: "" });
      await fetchSessions();
    } catch (e: any) {
      setFormError(e.message || "Failed to start session.");
    } finally { setSubmitting(false); }
  };

  const handleEnd = async (id: number) => {
    setEnding(id);
    try {
      await fetch(`${API}/delivery-sessions/${id}/end`, { method: "PATCH" });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, is_active: false, ended_at: new Date().toISOString() } : s));
    } catch (e) { console.error(e); }
    finally { setEnding(null); }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });

  const duration = (start: string, end: string | null) => {
    const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
    const m = Math.floor(ms / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <>
      <style>{styles}</style>

      <div className="ph">
        <div>
          <h1 className="pt">Delivery Sessions</h1>
          <p className="ps">Assign partners and manage active deliveries</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
          {sessions.length > 0 && <div className="hc">{sessions.filter(s => s.is_active).length} active</div>}
          <button className="btn-p" onClick={() => { setShowModal(true); setFormError(""); }}>+ Start Session</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </div>
          <p>No delivery sessions yet</p>
          <span>Start one by assigning an order to a delivery partner</span>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map(s => (
            <div key={s.id} className={`session-card ${s.is_active ? "card-active" : "card-ended"}`}>
              <div className="sc-top">
                <div className="sc-id">
                  <span className="sc-id-label">Session</span>
                  <span className="sc-id-val">SES-{String(s.id).padStart(4,"0")}</span>
                </div>
                <span className={`pill ${s.is_active ? "pill-live" : "pill-done"}`}>
                  {s.is_active ? (
                    <><span className="pulse-dot" />Live</>
                  ) : "Completed"}
                </span>
              </div>

              <div className="sc-order">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 5.5h3.5M5 10.5h4"/></svg>
                <span>ORD-{String(s.order_id).padStart(5,"0")}</span>
                {s.order && <span className="addr-tag">{s.order.pickup_address.split(",")[0]}</span>}
              </div>

              <div className="sc-partner">
                <div className="avatar">{(s.deliveryPartner?.name || "?")[0].toUpperCase()}</div>
                <div>
                  <div className="partner-name">{s.deliveryPartner?.name || `Partner #${s.delivery_partner_id}`}</div>
                  <div className="partner-email">{s.deliveryPartner?.email || ""}</div>
                </div>
              </div>

              <div className="sc-times">
                <div className="time-row">
                  <span className="time-label">Started</span>
                  <span className="time-val">{fmt(s.started_at)}</span>
                </div>
                {s.ended_at && (
                  <div className="time-row">
                    <span className="time-label">Ended</span>
                    <span className="time-val">{fmt(s.ended_at)}</span>
                  </div>
                )}
                <div className="time-row">
                  <span className="time-label">Duration</span>
                  <span className="time-val dur">{duration(s.started_at, s.ended_at)}</span>
                </div>
              </div>

              {s.is_active && (
                <button
                  className="btn-end"
                  onClick={() => handleEnd(s.id)}
                  disabled={ending === s.id}
                >
                  {ending === s.id ? "Ending…" : "End Session"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="mh">
              <h2 className="mt">Start Delivery Session</h2>
              <button className="mc" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="mb">
              <div className="field">
                <label className="fl">Order</label>
                <select className="fi" value={form.order_id} onChange={e => setForm(f => ({...f, order_id: e.target.value}))}>
                  <option value="">Select order…</option>
                  {orders.map(o => <option key={o.id} value={o.id}>ORD-{String(o.id).padStart(5,"0")} — {o.pickup_address.slice(0,30)}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="fl">Delivery Partner</label>
                <select className="fi" value={form.delivery_partner_id} onChange={e => setForm(f => ({...f, delivery_partner_id: e.target.value}))}>
                  <option value="">Select partner…</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name} — {p.email}</option>)}
                </select>
                {partners.length === 0 && <span className="fi-hint">No delivery_partner role users found</span>}
              </div>
              {formError && <p className="ferr">{formError}</p>}
            </div>
            <div className="mf">
              <button className="btn-g" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-p" onClick={handleStart} disabled={submitting}>
                {submitting ? "Starting…" : "Start Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  .ph { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; gap:16px; flex-wrap:wrap; }
  .pt { font-size:26px; font-weight:700; color:#0F172A; letter-spacing:-0.4px; line-height:1; }
  .ps { font-size:13px; color:#94A3B8; margin-top:6px; }
  .hc { background:#FFF7ED; color:#C2410C; font-size:13px; font-weight:600; padding:6px 14px; border-radius:8px; border:1px solid #FDBA74; white-space:nowrap; }

  .btn-p { background:#0F172A; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .12s; }
  .btn-p:hover { background:#1E293B; }
  .btn-p:disabled { opacity:0.55; cursor:not-allowed; }
  .btn-g { background:transparent; color:#64748B; border:1px solid #E2E8F0; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:500; cursor:pointer; font-family:inherit; }
  .btn-g:hover { background:#F8FAFC; }

  .loading-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  .skeleton-card { height:240px; border-radius:14px; background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .empty-state { text-align:center; padding:80px 20px; }
  .empty-icon { width:56px; height:56px; border-radius:14px; background:#F8FAFC; border:1px solid #E2E8F0; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .empty-icon svg { width:24px; height:24px; color:#94A3B8; }
  .empty-state p { font-size:15px; font-weight:600; color:#0F172A; margin-bottom:6px; }
  .empty-state span { font-size:13px; color:#94A3B8; }

  .sessions-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }

  .session-card { border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:16px; transition:transform .15s; }
  .session-card:hover { transform:translateY(-2px); }
  .card-active { background:#fff; border:1px solid #E2E8F0; box-shadow:0 4px 20px rgba(0,0,0,.06); }
  .card-ended  { background:#F8FAFC; border:1px solid #F1F5F9; }

  .sc-top { display:flex; align-items:center; justify-content:space-between; }
  .sc-id-label { font-size:10px; font-weight:700; color:#94A3B8; letter-spacing:1.4px; text-transform:uppercase; display:block; margin-bottom:2px; }
  .sc-id-val { font-family:'DM Mono',monospace; font-size:15px; font-weight:500; color:#0F172A; }

  .pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; }
  .pill-live { background:#FFF7ED; color:#C2410C; border:1px solid #FDBA74; }
  .pill-done { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }
  .pulse-dot { width:6px; height:6px; border-radius:50%; background:#EA580C; animation:pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

  .sc-order { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:600; color:#334155; }
  .sc-order svg { width:15px; height:15px; color:#94A3B8; flex-shrink:0; }
  .addr-tag { font-size:11.5px; font-weight:500; background:#F1F5F9; color:#64748B; padding:2px 8px; border-radius:4px; }

  .sc-partner { display:flex; align-items:center; gap:10px; padding:12px; background:#F8FAFC; border-radius:10px; border:1px solid #F1F5F9; }
  .avatar { width:34px; height:34px; border-radius:50%; background:#0F172A; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
  .partner-name  { font-size:13.5px; font-weight:600; color:#0F172A; }
  .partner-email { font-size:12px; color:#94A3B8; }

  .sc-times { display:flex; flex-direction:column; gap:6px; }
  .time-row  { display:flex; justify-content:space-between; align-items:center; }
  .time-label { font-size:12px; color:#94A3B8; }
  .time-val   { font-size:12.5px; color:#475569; font-weight:500; }
  .dur        { color:#0F172A; font-weight:700; font-family:'DM Mono',monospace; }

  .btn-end { width:100%; padding:9px; border-radius:8px; background:transparent; border:1.5px solid #E2E8F0; color:#64748B; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .12s; }
  .btn-end:hover { background:#FFF1F0; border-color:#FECACA; color:#DC2626; }
  .btn-end:disabled { opacity:0.5; cursor:not-allowed; }

  .backdrop { position:fixed; inset:0; background:rgba(15,23,42,0.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
  .modal { background:#fff; border-radius:14px; border:1px solid #E2E8F0; width:100%; max-width:440px; box-shadow:0 20px 60px rgba(0,0,0,.12); }
  .mh { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 16px; border-bottom:1px solid #F1F5F9; }
  .mt { font-size:16px; font-weight:700; color:#0F172A; }
  .mc { background:none; border:none; font-size:16px; color:#94A3B8; cursor:pointer; padding:2px 6px; border-radius:4px; }
  .mc:hover { background:#F1F5F9; }
  .mb { padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
  .mf { padding:16px 24px 20px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #F1F5F9; }

  .field { display:flex; flex-direction:column; gap:6px; }
  .fl { font-size:12.5px; font-weight:600; color:#374151; }
  .fi { padding:9px 12px; border:1px solid #E2E8F0; border-radius:8px; font-size:13.5px; font-family:inherit; color:#0F172A; background:#F8FAFC; outline:none; transition:border-color .12s; }
  .fi:focus { border-color:#93C5FD; background:#fff; }
  .fi-hint { font-size:12px; color:#F59E0B; }
  .ferr { font-size:12.5px; color:#DC2626; padding:8px 12px; background:#FFF7F7; border:1px solid #FECACA; border-radius:6px; }
`;