// ─── Shared components — Employee & Manager ──────────────────────────────────
import { Plane } from 'lucide-react';
import Swal from 'sweetalert2';

// ── Status styles & badge ─────────────────────────────────────────────────────
export const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved:  'bg-green-500/10  text-green-400  border-green-500/20',
  rejected:  'bg-red-500/10    text-red-400    border-red-500/20',
  booked:    'bg-blue-500/10   text-blue-400   border-blue-500/20',
  completed: 'bg-gray-500/10   text-gray-400   border-gray-500/20',
  cancelled: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  disbursed: 'bg-teal-500/10   text-teal-400   border-teal-500/20',
};

export const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_STYLES[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
    {status}
  </span>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, accent, sub }) => (
  <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value ?? 0}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Serial number ─────────────────────────────────────────────────────────────
export const SerialNo = ({ n }) => (
  <span className="w-6 h-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0">
    {n}
  </span>
);

// ── Loading screen ────────────────────────────────────────────────────────────
export const LoadingScreen = ({ color = 'border-blue-500' }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-950">
    <div className={`w-8 h-8 border-2 ${color} border-t-transparent rounded-full animate-spin`} />
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
export const EmptyState = ({ message = 'Nothing here yet.', onAction, actionLabel }) => (
  <div className="bg-[#0d1117] border border-white/5 rounded-2xl py-20 text-center">
    <Plane size={40} className="text-gray-700 mx-auto mb-3" />
    <p className="text-gray-500 text-sm">{message}</p>
    {onAction && <button onClick={onAction} className="mt-4 text-blue-400 text-sm hover:underline">{actionLabel}</button>}
  </div>
);

// ── Info cell (trip detail grid) ──────────────────────────────────────────────
export const InfoCell = ({ Icon, label, value }) => (
  <div className="bg-gray-900/60 rounded-xl p-3">
    <p className="text-gray-600 text-[10px] flex items-center gap-1 uppercase tracking-wide">
      <Icon size={10} /> {label}
    </p>
    <p className="text-white text-sm font-medium mt-1">{value}</p>
  </div>
);

// ── Section card wrapper ──────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-[#0d1117] border border-white/5 rounded-2xl p-5 ${className}`}>{children}</div>
);

// ── Section heading inside a card ────────────────────────────────────────────
export const CardTitle = ({ children }) => (
  <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-4">{children}</h2>
);

// ── Formatters ────────────────────────────────────────────────────────────────
export const fmtDate  = d => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
export const fmtMoney = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
export const fmtRelTime = d => {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff/86400)}d ago`;
  return fmtDate(d);
};

// ── Category icons ────────────────────────────────────────────────────────────
export const CAT_ICON = { travel:'✈️', taxi:'🚕', hotel:'🏨', food:'🍔', other:'📦' };

// ── Swal helpers (z-index above all modals) ───────────────────────────────────
const SW = { background:'#0d1117', color:'#fff', confirmButtonColor:'#2563eb', customClass:{ container:'swal-on-top' } };
export const SA = {
  success: (t, tx) => Swal.fire({ icon:'success', title:t, text:tx, ...SW }),
  error:   (t, tx) => Swal.fire({ icon:'error',   title:t, text:tx, ...SW }),
  confirm: (t, tx) => Swal.fire({ icon:'warning', title:t, text:tx, ...SW, showCancelButton:true, confirmButtonText:'Yes!', cancelButtonText:'Cancel' }),
};

// ── Page header component ─────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-white text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ── Search input ──────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative max-w-sm">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-gray-900 border border-white/5 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition placeholder-gray-600"/>
  </div>
);
