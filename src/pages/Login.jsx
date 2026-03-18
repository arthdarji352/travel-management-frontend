import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Eye, EyeOff, Loader } from "lucide-react";

const ROUTES = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  hr: "/hr/dashboard",
  employee: "/employee/dashboard",
  finance: "/finance/dashboard",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const u = await login(email, password);
      setSuccess(`Welcome, ${u.name}!`);
      setTimeout(
        () => navigate(ROUTES[u.role] || "/login", { replace: true }),
        900,
      );
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : "Invalid email or password. Please try again.",
      );
      setBusy(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .lp-page {
          min-height:100vh; background:#fffffff;
          display:flex; align-items:center; justify-content:center;
          font-family:'Inter',sans-serif; padding:24px;
        }
        .lp-card {
          background:#fff; border-radius:20px;
          box-shadow:0 2px 40px rgba(0,0,0,0.08);
          width:100%; max-width:400px; padding:48px 44px 40px;
        }
        .lp-label { display:block; font-size:12px; font-weight:500; color:#6b7280; margin-bottom:6px; }
        .lp-input {
          width:100%; background:#fafaf8; border:1.5px solid #e8e7e3;
          border-radius:10px; color:#0f1115; padding:11px 14px; font-size:14px;
          font-family:'Inter',sans-serif; outline:none;
          transition:border-color 0.15s, box-shadow 0.15s;
        }
        .lp-input:focus { border-color:#0f1115; box-shadow:0 0 0 3px rgba(15,17,21,0.07); background:#fff; }
        .lp-input::placeholder { color:#d1d0cb; }
        .lp-eye {
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:#b0afab; cursor:pointer; display:flex; padding:0;
        }
        .lp-eye:hover { color:#6b7280; }
        .lp-btn {
          width:100%; background:#0f1115; border:none; border-radius:10px;
          color:#fff; font-family:'Inter',sans-serif; font-size:14px; font-weight:600;
          padding:12px; cursor:pointer; margin-top:4px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 2px 10px rgba(15,17,21,0.2); transition:background 0.15s, box-shadow 0.15s;
        }
        .lp-btn:hover:not(:disabled) { background:#222; box-shadow:0 4px 16px rgba(15,17,21,0.3); }
        .lp-btn:disabled { background:#b0afab; cursor:not-allowed; box-shadow:none; }
        .lp-err {
          background:#fff5f5; border:1.5px solid #fecaca; border-radius:10px;
          padding:11px 14px; display:flex; align-items:flex-start; gap:9px; margin-bottom:4px;
        }
        .lp-ok { background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:10px; padding:11px 14px; margin-bottom:4px; }
        @keyframes lp-spin { to { transform:rotate(360deg); } }
        .lp-spin { animation:lp-spin 0.8s linear infinite; display:inline-flex; }
      `}</style>

      <div className="lp-page">
        <div className="lp-card">
          {/* Brand */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "#0f1115",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="1.5" />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="3"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="9"
                  y1="10.5"
                  x2="3.8"
                  y2="7.5"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="15"
                  y1="10.5"
                  x2="20.2"
                  y2="7.5"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p
              style={{
                fontSize: "17px",
                fontWeight: 600,
                color: "#0f1115",
                letterSpacing: "-0.02em",
              }}
            >
              BSTO INDIA
            </p>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "3px" }}>
              Travel Expense Management System
            </p>
          </div>

          <div
            style={{ height: "1px", background: "#f0efec", margin: "0 0 28px" }}
          />

          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#0f1115",
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}
          >
            Sign in
          </p>
          <p
            style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "24px" }}
          >
            Enter your credentials to continue
          </p>

          {error && (
            <div className="lp-err">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                style={{ flexShrink: 0, marginTop: "2px" }}
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 8v4M12 15.5h.01"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span
                style={{ color: "#dc2626", fontSize: "13px", lineHeight: 1.5 }}
              >
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="lp-ok">
              <span style={{ color: "#16a34a", fontSize: "13px" }}>
                ✓ {success} Redirecting...
              </span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginTop: error || success ? "16px" : "0",
            }}
          >
            <div>
              <label className="lp-label">Email Address</label>
              <input
                type="email"
                className="lp-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@autodrive.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="lp-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  className="lp-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="lp-eye"
                  onClick={() => setShowPass((p) => !p)}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="lp-btn">
              {busy ? (
                <>
                  <span className="lp-spin">
                    <Loader size={15} />
                  </span>{" "}
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#c4c3be",
              marginTop: "28px",
              lineHeight: 1.6,
            }}
          >
            Don't have access? Contact your
            <br />
            system administrator.
          </p>
          <div>
            <div className="pt-2 text-center">
              <p className="text-gray-700 text-xs">
                Made with ❤️ by{" "}
                <span className="text-gray-500 font-medium">Arth</span> © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
