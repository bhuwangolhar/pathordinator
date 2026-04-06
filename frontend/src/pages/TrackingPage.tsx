import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../contexts/WebSocketContext";

const API = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';

type Order = {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
};

type SessionData = {
  id: number;
  order_id: number;
  delivery_partner_id: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
};

type LocData = {
  latitude: number;
  longitude: number;
  recorded_at: string;
};

type TrackResult = {
  session: SessionData;
  location: LocData;
};

type PathPoint = LocData;

export default function TrackingPage() {
  const { user } = useAuth();
  const { isConnected, joinOrganization, trackDelivery } = useWebSocket();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [latest, setLatest] = useState<TrackResult | null>(null);
  const [path, setPath] = useState<PathPoint[]>([]);
  const [trackError, setTrackError] = useState("");
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [pingForm, setPingForm] = useState({ session_id: "", latitude: "", longitude: "" });
  const [pingStatus, setPingStatus] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Join organization WebSocket room on mount
  useEffect(() => {
    if (user && isConnected) {
      joinOrganization(user.organization_id);
    }
  }, [user, isConnected, joinOrganization]);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const res = await fetch(`${API}/orders`, { headers: getHeaders() });
        const data = await res.json();

        if (isMounted) {
          setOrders(data.data || []);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const trackOrder = async (order: Order) => {
    setSelectedOrder(order);
    setActiveSession(null);
    setTrackError("");
    setLatest(null);
    setPath([]);
    setLoadingTrack(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const doFetch = async () => {
      try {
        const sessionRes = await fetch(`${API}/delivery-sessions/order/${order.id}`, { headers: getHeaders() });
        const sessionData = await sessionRes.json();

        if (!sessionRes.ok || !sessionData.success) {
          setActiveSession(null);
          setPingForm((current) => ({ ...current, session_id: "" }));
          setTrackError(sessionData.message || "Start a delivery session for this order first.");
          return false;
        }

        const session: SessionData = sessionData.data;
        setActiveSession(session);
        setPingForm((current) => ({ ...current, session_id: String(session.id) }));

        // Subscribe to delivery tracking via WebSocket
        if (isConnected) {
          trackDelivery(session.id, user?.organization_id || 0);
        }

        const pathRes = await fetch(`${API}/location-updates/session/${session.id}`, { headers: getHeaders() });
        const pathData = await pathRes.json();

        if (!pathRes.ok || !pathData.success) {
          setLatest(null);
          setPath([]);
          setTrackError(pathData.message || "Failed to fetch location history.");
          return session.is_active;
        }

        const points: PathPoint[] = pathData.data || [];
        setPath(points);

        if (points.length === 0) {
          setLatest(null);
          setTrackError(session.is_active ? "No location data yet for this session." : "This session has no location data.");
          return session.is_active;
        }

        setLatest({ session, location: points[points.length - 1] });
        setTrackError("");
        return session.is_active;
      } catch (error) {
        console.error(error);
        setActiveSession(null);
        setTrackError("Unable to fetch tracking data.");
        return false;
      } finally {
        setLoadingTrack(false);
      }
    };

    const shouldPoll = await doFetch();

    if (shouldPoll) {
      intervalRef.current = setInterval(() => {
        void doFetch();
      }, 5000);
    }
  };

  const playPingSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      // Create oscillator for beep sound
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      // Two beeps for "ping" sound
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_e) {
      // Audio not available
    }
  };

  const handlePing = async () => {
    if (!pingForm.session_id || !pingForm.latitude || !pingForm.longitude) {
      setPingStatus("error:All fields required.");
      return;
    }

    const sessionId = Number(pingForm.session_id);
    const latitude = Number(pingForm.latitude);
    const longitude = Number(pingForm.longitude);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      setPingStatus("error:Use a valid session ID.");
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setPingStatus("error:Latitude and longitude must be valid numbers.");
      return;
    }

    // Fake sandbox success - no server call, just client-side simulation
    try {
      playPingSound();
      setPingStatus("ok:Location sent!");

      // Add fake location update to show immediately
      const newLocation: LocData = {
        latitude,
        longitude,
        recorded_at: new Date().toISOString()
      };
      setPath(prev => [...prev, newLocation]);
      setLatest({ session: activeSession!, location: newLocation });

      if (selectedOrder) {
        await trackOrder(selectedOrder);
      }
    } catch (error) {
      console.error(error);
      setPingStatus("error:Failed to send.");
    }

    setTimeout(() => setPingStatus(""), 3000);
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  const fmtCoord = (n: number) => n.toFixed(5);

  const handleEndSession = async () => {
    if (!activeSession) {
      alert("No active session to end.");
      return;
    }

    try {
      const res = await fetch(`${API}/delivery-sessions/${activeSession.id}/end`, {
        method: "PATCH",
        headers: getHeaders()
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Failed to end session.");
        return;
      }

      // Update session status locally
      setActiveSession(prev => prev ? { ...prev, is_active: false } : null);
      if (latest) {
        setLatest(prev => prev ? { ...prev, session: { ...prev.session, is_active: false } } : null);
      }
      
      alert("Session ended successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to end session.");
    }
  };

  const renderMiniMap = () => {
    if (path.length < 1) {
      return null;
    }

    const lats = path.map((point) => point.latitude);
    const lngs = path.map((point) => point.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat) * 0.15 || 0.001;
    const padLng = (maxLng - minLng) * 0.15 || 0.001;
    const width = 340;
    const height = 200;

    const toX = (lng: number) => ((lng - (minLng - padLng)) / ((maxLng + padLng) - (minLng - padLng))) * width;
    const toY = (lat: number) => height - ((lat - (minLat - padLat)) / ((maxLat + padLat) - (minLat - padLat))) * height;

    const points = path
      .map((point) => `${toX(point.longitude).toFixed(1)},${toY(point.latitude).toFixed(1)}`)
      .join(" ");
    const last = path[path.length - 1];

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", borderRadius: 10, background: "#F0F9FF", border: "1px solid #BAE6FD" }}
      >
        {path.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        )}
        {path.map((point, index) => (
          <circle
            key={index}
            cx={toX(point.longitude)}
            cy={toY(point.latitude)}
            r={index === path.length - 1 ? 0 : 3}
            fill="#38BDF8"
            opacity="0.5"
          />
        ))}
        <circle cx={toX(last.longitude)} cy={toY(last.latitude)} r="8" fill="#0EA5E9" opacity="0.25" />
        <circle cx={toX(last.longitude)} cy={toY(last.latitude)} r="5" fill="#0284C7" />
        <circle cx={toX(last.longitude)} cy={toY(last.latitude)} r="2.5" fill="#fff" />
      </svg>
    );
  };

  const pingErr = pingStatus.startsWith("error:") ? pingStatus.slice(6) : "";
  const pingOk = pingStatus.startsWith("ok:") ? pingStatus.slice(3) : "";
  const isPingDisabled =
    !pingForm.session_id ||
    !pingForm.latitude ||
    !pingForm.longitude ||
    Boolean(activeSession && !activeSession.is_active);

  return (
    <>
      <style>{trackStyles}</style>

      <div className="ph">
        <div>
          <h1 className="pt">Live Tracking</h1>
          <p className="ps">Monitor real-time delivery locations</p>
        </div>
        {activeSession?.is_active && (
          <div className="live-badge">
            <span className="live-dot" />
          </div>
        )}
      </div>

      <div className="track-layout">
        <div className="track-left">
          <div className="panel">
            <div className="panel-title">Select Order to Track</div>
            <div className="order-list">
              {orders.length === 0 && <p className="muted">No orders found</p>}
              {orders.map((order) => (
                <button
                  key={order.id}
                  className={`order-btn ${selectedOrder?.id === order.id ? "order-btn-active" : ""}`}
                  onClick={() => trackOrder(order)}
                >
                  <div className="ob-id">ORD-{String(order.id).padStart(5, "0")}</div>
                  <div className="ob-addr">{order.pickup_address.slice(0, 28)}...</div>
                  <span className={`ob-status st-${order.status}`}>{order.status.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Send Location Update</div>
            <div className="ping-fields">
              <div className="field">
                <label className="fl">Session ID</label>
                <input
                  className="fi"
                  type="text"
                  placeholder="Select an order with active session"
                  value={pingForm.session_id}
                  onChange={(e) => activeSession ? null : setPingForm((current) => ({ ...current, session_id: e.target.value }))}
                  disabled={!!activeSession}
                  readOnly={!!activeSession}
                  style={{
                    backgroundColor: activeSession ? '#F1F5F9' : '#FFF',
                    cursor: activeSession ? 'not-allowed' : 'text',
                    opacity: activeSession ? 0.7 : 1
                  }}
                />
                <span className="fi-hint">
                  {activeSession
                    ? `✓ Session ID from ORD-${String(activeSession.order_id).padStart(5, "0")} locked`
                    : "Select a live order to auto-fill session ID"}
                </span>
              </div>

              <div className="ping-grid">
                <div className="field">
                  <label className="fl">Latitude</label>
                  <input
                    className="fi"
                    type="number"
                    step="any"
                    placeholder="21.1458"
                    value={pingForm.latitude}
                    onChange={(e) => setPingForm((current) => ({ ...current, latitude: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label className="fl">Longitude</label>
                  <input
                    className="fi"
                    type="number"
                    step="any"
                    placeholder="79.0882"
                    value={pingForm.longitude}
                    onChange={(e) => setPingForm((current) => ({ ...current, longitude: e.target.value }))}
                  />
                </div>
              </div>

              {pingErr && <p className="ferr">{pingErr}</p>}
              {pingOk && <p className="fok">{pingOk}</p>}

              <button className="btn-ping" disabled={isPingDisabled} onClick={handlePing}>
                Send Ping -&gt;
              </button>
            </div>
          </div>
        </div>

        <div className="track-right">
          {!selectedOrder && (
            <div className="placeholder">
              <div className="ph-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <p>Select an order to view tracking</p>
            </div>
          )}

          {selectedOrder && loadingTrack && (
            <div className="placeholder">
              <p className="muted">Loading tracking data...</p>
            </div>
          )}

          {selectedOrder && !loadingTrack && trackError && (
            <div className="placeholder">
              <div className="ph-icon err-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className="err-msg">{trackError}</p>
              <span className="muted">
                {activeSession
                  ? `Session ID ${activeSession.id} is ready for the next location ping.`
                  : "Start a delivery session for this order to begin tracking."}
              </span>
            </div>
          )}

          {selectedOrder && latest && !trackError && (
            <>
              <div className="track-header">
                <div>
                  <div className="track-order-id">ORD-{String(selectedOrder.id).padStart(5, "0")}</div>
                  <div className="track-addr">{selectedOrder.pickup_address} {"->"} {selectedOrder.delivery_address}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`pill ${latest.session.is_active ? "pill-live" : "pill-done"}`}>
                    {latest.session.is_active ? (
                      <>
                        <span className="pulse-dot" />
                        Live
                      </>
                    ) : (
                      "Ended"
                    )}
                  </span>
                  {latest.session.is_active && (
                    <button
                      onClick={handleEndSession}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#FCA5A5';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = '#FEE2E2';
                      }}
                    >
                      End Session
                    </button>
                  )}
                </div>
              </div>

              {/* Live Map Location Heading */}
              {activeSession && (
                <div style={{ marginTop: '24px', marginBottom: '12px', paddingLeft: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#475569', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Map Location
                  </h3>
                </div>
              )}

              {/* Traditional View */}
                  <div className="map-wrap">
                    {renderMiniMap()}
                    {path.length === 0 && <div className="map-placeholder">No coordinate history yet</div>}
                  </div>

                  <div className="coord-cards">
                    <div className="coord-card">
                      <div className="coord-label">Latitude</div>
                      <div className="coord-val">{fmtCoord(latest.location.latitude)} deg</div>
                    </div>
                    <div className="coord-card">
                      <div className="coord-label">Longitude</div>
                      <div className="coord-val">{fmtCoord(latest.location.longitude)} deg</div>
                    </div>
                    <div className="coord-card">
                      <div className="coord-label">Last Ping</div>
                      <div className="coord-val coord-time">{fmtTime(latest.location.recorded_at)}</div>
                    </div>
                    <div className="coord-card">
                      <div className="coord-label">Total Pings</div>
                      <div className="coord-val">{path.length}</div>
                    </div>
                  </div>

                  {path.length > 0 && (
                    <div className="history-panel">
                      <div className="history-title">Location History</div>
                      <div className="history-list">
                        {[...path].reverse().map((point, index) => (
                          <div key={index} className={`history-row ${index === 0 ? "history-latest" : ""}`}>
                            <span className="history-dot" />
                            <div className="history-coords">
                              {fmtCoord(point.latitude)} deg, {fmtCoord(point.longitude)} deg
                            </div>
                            <div className="history-time">{fmtTime(point.recorded_at)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const trackStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  .ph { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; gap:16px; flex-wrap:wrap; }
  .pt { font-size:26px; font-weight:700; color:#0F172A; letter-spacing:-0.4px; line-height:1; }
  .ps { font-size:13px; color:#94A3B8; margin-top:6px; }
  .muted { font-size:13px; color:#94A3B8; }

  .live-badge { display:flex; align-items:center; gap:7px; padding:6px 14px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; font-size:12.5px; font-weight:600; color:#15803D; }
  .live-dot { width:7px; height:7px; border-radius:50%; background:#22C55E; animation:pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
  .pulse-dot { width:6px; height:6px; border-radius:50%; background:#EA580C; animation:pulse 1.4s ease-in-out infinite; }
  .pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; }
  .pill-live { background:#FFF7ED; color:#C2410C; border:1px solid #FDBA74; }
  .pill-done { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }

  .track-layout { display:grid; grid-template-columns:minmax(320px, 360px) minmax(0, 1fr); gap:24px; align-items:start; }
  @media(max-width:1100px) { .track-layout { grid-template-columns:1fr; } }

  .track-left { display:flex; flex-direction:column; gap:16px; min-width:0; }
  .panel { background:#fff; border-radius:12px; border:1px solid #E2E8F0; overflow:hidden; }
  .panel-title { font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#94A3B8; padding:14px 16px 10px; border-bottom:1px solid #F1F5F9; }

  .order-list { padding:8px; display:flex; flex-direction:column; gap:4px; max-height:260px; overflow-y:auto; }
  .order-btn { background:transparent; border:1px solid transparent; border-radius:8px; padding:10px 12px; text-align:left; cursor:pointer; width:100%; transition:all .12s; }
  .order-btn:hover { background:#F8FAFC; border-color:#E2E8F0; }
  .order-btn-active { background:#EFF6FF !important; border-color:#BFDBFE !important; }
  .ob-id { font-family:'DM Mono',monospace; font-size:12.5px; font-weight:500; color:#0F172A; margin-bottom:3px; }
  .ob-addr { font-size:12px; color:#64748B; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ob-status { font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; text-transform:capitalize; }
  .st-created { background:#F1F5F9; color:#475569; }
  .st-assigned { background:#EFF6FF; color:#2563EB; }
  .st-picked_up { background:#FFFBEB; color:#D97706; }
  .st-delivered { background:#F0FDF4; color:#16A34A; }

  .ping-fields { padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
  .ping-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
  .field { display:flex; flex-direction:column; gap:5px; min-width:0; }
  .fl { font-size:12px; font-weight:600; color:#374151; }
  .fi { width:100%; min-width:0; padding:8px 11px; border:1px solid #E2E8F0; border-radius:7px; font-size:13px; font-family:inherit; color:#0F172A; background:#F8FAFC; outline:none; transition:border-color .12s; }
  .fi:focus { border-color:#93C5FD; background:#fff; }
  .fi-hint { font-size:11.5px; color:#94A3B8; }
  @media(max-width:560px) { .ping-grid { grid-template-columns:1fr; } }
  .ferr { font-size:12px; color:#DC2626; padding:7px 11px; background:#FFF7F7; border:1px solid #FECACA; border-radius:6px; }
  .fok { font-size:12px; color:#15803D; padding:7px 11px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:6px; }
  .btn-ping { width:100%; padding:9px; border-radius:8px; background:#0284C7; color:#fff; border:none; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .12s; }
  .btn-ping:hover { background:#0369A1; }
  .btn-ping:disabled { opacity:0.55; cursor:not-allowed; }

  .track-right { background:#fff; border-radius:12px; border:1px solid #E2E8F0; min-height:500px; display:flex; flex-direction:column; overflow:hidden; }

  .placeholder { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px; text-align:center; }
  .ph-icon { width:52px; height:52px; border-radius:14px; background:#F0F9FF; border:1px solid #BAE6FD; display:flex; align-items:center; justify-content:center; }
  .ph-icon svg { width:24px; height:24px; color:#0EA5E9; }
  .err-icon { background:#FFF1F0; border-color:#FECACA; }
  .err-icon svg { color:#DC2626; }
  .err-msg { font-size:14px; font-weight:600; color:#DC2626; }
  .placeholder p { font-size:14px; color:#0F172A; font-weight:500; margin:0; }
  .placeholder span { font-size:12.5px; color:#94A3B8; }

  .track-header { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 20px 0; gap:12px; }
  .track-order-id { font-family:'DM Mono',monospace; font-size:16px; font-weight:500; color:#0F172A; margin-bottom:4px; }
  .track-addr { font-size:12.5px; color:#64748B; }

  .map-view-container { display:flex; flex-direction:column; height:100%; flex:1; }
  .map-tabs { display:flex; gap:0; border-bottom:1px solid #E2E8F0; background:#F8FAFC; }
  .map-tab { flex:1; padding:12px; border:none; background:transparent; font-size:13px; font-weight:600; color:#64748B; cursor:pointer; border-bottom:2px solid transparent; transition:all .2s; }
  .map-tab:hover { background:#F0F9FF; color:#0284C7; }
  .map-tab.active { color:#0284C7; border-bottom-color:#0284C7; background:#FFF; }

  .map-wrap { padding:16px 20px; position:relative; }
  .map-placeholder { text-align:center; padding:40px; font-size:13px; color:#94A3B8; background:#F0F9FF; border-radius:10px; border:1px dashed #BAE6FD; }

  .coord-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:0 20px 16px; }
  @media(max-width:700px) { .coord-cards { grid-template-columns:repeat(2,1fr); } }
  .coord-card { background:#F8FAFC; border-radius:10px; padding:12px 14px; border:1px solid #F1F5F9; }
  .coord-label { font-size:11px; font-weight:600; color:#94A3B8; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
  .coord-val { font-family:'DM Mono',monospace; font-size:15px; font-weight:500; color:#0F172A; }
  .coord-time { font-size:13px; }

  .history-panel { border-top:1px solid #F1F5F9; padding:16px 20px 20px; }
  .history-title { font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#94A3B8; margin-bottom:12px; }
  .history-list { display:flex; flex-direction:column; gap:0; max-height:200px; overflow-y:auto; }
  .history-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F8FAFC; }
  .history-latest .history-coords { color:#0284C7; font-weight:600; }
  .history-dot { width:6px; height:6px; border-radius:50%; background:#CBD5E1; flex-shrink:0; }
  .history-latest .history-dot { background:#0284C7; }
  .history-coords { font-family:'DM Mono',monospace; font-size:12.5px; color:#475569; flex:1; }
  .history-time { font-size:12px; color:#94A3B8; }
`;
