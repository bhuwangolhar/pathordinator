import React, { useState } from "react";
import "./UserDetailModal.css";
import { useAuth } from "../contexts/AuthContext";
import { useRefresh } from "../contexts/RefreshContext";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  organizationId: number;
  onRefresh: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  organizationId,
  onRefresh,
}) => {
  const { user: currentUser } = useAuth();
  const { triggerUsersRefresh } = useRefresh();
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  if (!user || !currentUser) return null;

  const handleVerifyPassword = async () => {
    if (!password) {
      setMessage("Please enter a password");
      setMessageType("error");
      return;
    }

    setVerifying(true);
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/auth/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          password,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.passwordValid) {
        setIsPasswordVerified(true);
        setMessage("");
        setPassword("");
      } else {
        setMessage("Invalid password");
        setMessageType("error");
        setPassword("");
      }
    } catch (error) {
      setMessage("Error verifying password");
      setMessageType("error");
    } finally {
      setVerifying(false);
    }
  };

  const handleUserAction = async (action: "activate" | "deactivate") => {
    setActionLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/organizations/${organizationId}/users/${user.id}/${action}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(
          `User ${action === "activate" ? "activated" : "deactivated"} successfully`
        );
        setMessageType("success");
        setTimeout(() => {
          triggerUsersRefresh(`User ${action}d`);
          onRefresh();
          onClose();
        }, 1500);
      } else {
        setMessage(data.message || `Failed to ${action} user`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`Error ${action}ing user`);
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="user-info">
            <div className="info-field">
              <label>Name</label>
              <p>{user.name}</p>
            </div>
            <div className="info-field">
              <label>Email</label>
              <p>{user.email}</p>
            </div>
            <div className="info-field">
              <label>Role</label>
              <p className="role-badge">{user.role}</p>
            </div>
            <div className="info-field">
              <label>Status</label>
              <p className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                {user.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          {!isPasswordVerified ? (
            <div className="password-section">
              <p className="password-prompt">
                Verify your password to manage this user:
              </p>
              <input
                type="password"
                className="password-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleVerifyPassword();
                }}
                disabled={verifying}
              />
              {message && (
                <p className={`message message-${messageType}`}>{message}</p>
              )}
            </div>
          ) : (
            <div className="verified-section">
              <p className="verified-message">✓ Password verified</p>
              {message && (
                <p className={`message message-${messageType}`}>{message}</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </button>

          {!isPasswordVerified ? (
            <button
              className="btn-verify"
              onClick={handleVerifyPassword}
              disabled={verifying || !password}
            >
              {verifying ? "Verifying..." : "Verify Password"}
            </button>
          ) : (
            <>
              {user.is_active ? (
                <button
                  className="btn-deactivate"
                  onClick={() => handleUserAction("deactivate")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deactivating..." : "Deactivate User"}
                </button>
              ) : (
                <button
                  className="btn-activate"
                  onClick={() => handleUserAction("activate")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Activating..." : "Activate User"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
