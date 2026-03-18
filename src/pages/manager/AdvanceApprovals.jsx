import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, X, Loader, Wallet, Calendar, User, MapPin, Clock } from 'lucide-react';
import API from '../../api/axios.js';
import { SA, StatusBadge, LoadingScreen, SearchInput, fmtDate, fmtMoney } from '../../components/employee/shared.jsx';

// ── Advance Detail Modal ──────────────────────────────────────────────────────
const DetailModal = ({ advance, onClose, onAction }) => {
  const [saving, setSaving] = useState('');

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const approve = async () => {
    setSaving('approve');
    try {
      await API.put(`/advance/${advance._id}/approve`);
      SA.success('Advance Approved!', `₹${advance.amount?.toLocaleString()} approved for ${advance.employee?.name}.`);
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  const reject = async () => {
    setSaving('reject');
    try {
      await API.put(`/advance/${advance._id}/reject`);
      SA.success('Advance Rejected', 'Employee has been notified.');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'480px', boxShadow:'0 32px 64px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/15 rounded-xl flex items-center justify-center">
              <Wallet size={18} className="text-yellow-400"/>
            </div>
            <div>
              <p className="text-white font-semibold">Advance Request</p>
              <p className="text-gray-500 text-xs mt-0.5">Review and take action</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Employee info */}
          <div className="flex items-center gap-4 bg-gray-900/60 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {advance.employee?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{advance.employee?.name}</p>
              <p className="text-gray-500 text-sm truncate">{advance.employee?.email}</p>
            </div>
            <StatusBadge status={advance.status}/>
          </div>

          {/* Amount — big and clear */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Amount Requested</p>
            <p className="text-yellow-400 text-4xl font-bold">₹{advance.amount?.toLocaleString('en-IN')}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {advance.travelRequest?.destination && (
              <div className="bg-gray-900/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={11} className="text-gray-500"/>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Destination</p>
                </div>
                <p className="text-white text-sm font-medium">{advance.travelRequest.destination}</p>
              </div>
            )}
            <div className="bg-gray-900/60 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={11} className="text-gray-500"/>
                <p className="text-gray-500 text-xs uppercase tracking-wide">Requested</p>
              </div>
              <p className="text-white text-sm font-medium">{fmtDate(advance.createdAt)}</p>
            </div>
          </div>

          {/* Reason */}
          {advance.reason && (
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Reason</p>
              <p className="text-gray-200 text-sm leading-relaxed">{advance.reason}</p>
            </div>
          )}

          {/* Action buttons */}
          {advance.status === 'pending' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={approve} disabled={!!saving}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
                {saving === 'approve' ? <Loader size={15} className="animate-spin"/> : <CheckCircle size={15}/>}
                Approve
              </button>
              <button onClick={reject} disabled={!!saving}
                className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
                {saving === 'reject' ? <Loader size={15} className="animate-spin"/> : <XCircle size={15}/>}
                Reject
              </button>
            </div>
          )}
          {advance.status !== 'pending' && (
            <div className={`rounded-xl p-3 text-center text-sm font-medium
              ${advance.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              This request has been {advance.status}.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdvanceApprovals() {
  const [advances, setAdvances] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await API.get('/advance'); setAdvances(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = () => {
    load();
    if (selected) API.get(`/advance/${selected._id}`).then(r => setSelected(r.data)).catch(() => {});
  };

  const counts = {
    all:      advances.length,
    pending:  advances.filter(a => a.status === 'pending').length,
    approved: advances.filter(a => a.status === 'approved').length,
    rejected: advances.filter(a => a.status === 'rejected').length,
  };

  const filtered = advances
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a =>
      !search ||
      a.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.travelRequest?.destination?.toLowerCase().includes(search.toLowerCase())
    );

  const totalPending = advances.filter(a => a.status === 'pending').reduce((s,a) => s+(a.amount||0), 0);

  if (loading) return <LoadingScreen color="border-purple-500"/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Advance Approvals</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {counts.pending} pending &nbsp;·&nbsp;
            <span className="text-yellow-400 font-medium">{fmtMoney(totalPending)}</span> awaiting approval
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total Requests',  val: counts.all,      color:'bg-gray-900',         text:'text-white'       },
          { label:'Pending',         val: counts.pending,  color:'bg-yellow-500/10',    text:'text-yellow-400'  },
          { label:'Approved',        val: counts.approved, color:'bg-green-500/10',     text:'text-green-400'   },
          { label:'Rejected',        val: counts.rejected, color:'bg-red-500/10',       text:'text-red-400'     },
        ].map(c => (
          <div key={c.label} className={`${c.color} border border-white/5 rounded-2xl p-4`}>
            <p className="text-gray-500 text-xs">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.text}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition
                ${filter === key ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
              {key} ({count})
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employee or destination..."/>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl text-center py-16">
          <Wallet size={36} className="text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">No advance requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <div key={a._id}
              className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition cursor-pointer group"
              onClick={() => setSelected(a)}>

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {a.employee?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{a.employee?.name}</p>
                    <p className="text-gray-500 text-xs truncate">{a.employee?.email}</p>
                  </div>
                </div>
                <StatusBadge status={a.status}/>
              </div>

              {/* Amount */}
              <div className="bg-yellow-500/10 border border-yellow-500/15 rounded-xl p-3 text-center mb-3">
                <p className="text-gray-500 text-xs mb-1">Amount</p>
                <p className="text-yellow-400 text-2xl font-bold">{fmtMoney(a.amount)}</p>
              </div>

              {/* Info */}
              <div className="space-y-2">
                {a.travelRequest?.destination && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={11}/> <span className="text-gray-300">{a.travelRequest.destination}</span>
                  </div>
                )}
                {a.reason && (
                  <p className="text-gray-500 text-xs line-clamp-2">{a.reason}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock size={11}/> {fmtDate(a.createdAt)}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-600 text-xs">Click to review</span>
                {a.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"/>
                    <span className="text-yellow-400 text-xs font-medium">Action needed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DetailModal
          advance={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
