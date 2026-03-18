import { useEffect, useState } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronUp, Users, Plane, X, CheckCircle, XCircle } from 'lucide-react';
import API from '../../api/axios.js';

const fmt   = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtDt = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

const StatusBadge = ({ status }) => {
  const map = {
    pending:'bg-yellow-500/10 text-yellow-400', approved:'bg-green-500/10 text-green-400',
    rejected:'bg-red-500/10 text-red-400', booked:'bg-blue-500/10 text-blue-400',
    completed:'bg-purple-500/10 text-purple-400', cancelled:'bg-gray-500/10 text-gray-400',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status]||'bg-gray-500/10 text-gray-400'}`}>{status}</span>;
};

const CAT_LABELS = { travel:'✈ Travel', taxi:'🚕 Taxi', hotel:'🏨 Hotel', food:'🍽 Food', other:'📦 Other' };

// ── Expense Breakdown Row ────────────────────────────────────────────────────
const BreakdownRow = ({ breakdown }) => (
  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-gray-700">
    {Object.entries(CAT_LABELS).map(([k,label]) => (
      <div key={k} className="bg-gray-800 rounded-lg p-2 text-center">
        <p className="text-gray-400 text-xs mb-0.5">{label}</p>
        <p className="text-white text-xs font-semibold">{fmt(breakdown?.[k]||0)}</p>
      </div>
    ))}
    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 text-center">
      <p className="text-blue-400 text-xs mb-0.5">💰 Total</p>
      <p className="text-blue-300 text-xs font-bold">{fmt(breakdown?.total||0)}</p>
    </div>
  </div>
);

// ── Trip Row (expandable) ────────────────────────────────────────────────────
const TripRow = ({ trip, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(p=>!p)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition text-left">
        <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">{idx}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{trip.from} → {trip.destination}</p>
          <p className="text-gray-400 text-xs">{fmtDt(trip.fromDate)} — {fmtDt(trip.toDate)}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={trip.status}/>
          <p className="text-green-400 text-sm font-semibold">{fmt(trip.breakdown?.total)}</p>
          {open ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 bg-gray-900">
          <p className="text-gray-400 text-xs pt-3"><span className="font-medium text-gray-300">Purpose:</span> {trip.purpose}</p>
          {trip.expenses?.length > 0
            ? <BreakdownRow breakdown={trip.breakdown}/>
            : <p className="text-gray-600 text-xs mt-3 pt-3 border-t border-gray-700">No expenses recorded for this trip.</p>
          }
        </div>
      )}
    </div>
  );
};

// ── Employee Row (expandable) ─────────────────────────────────────────────────
const EmpRow = ({ row }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(p=>!p)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-gray-900 hover:bg-gray-800/60 transition text-left">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {row.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{row.user.name}</p>
          <p className="text-gray-400 text-xs">{row.user.email}</p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-center hidden sm:block">
            <p className="text-white font-bold">{row.totalTravels}</p>
            <p className="text-gray-500 text-xs">Trips</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 font-bold">{fmt(row.totalExpenses)}</p>
            <p className="text-gray-500 text-xs">Total Expense</p>
          </div>
          {open ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
        </div>
      </button>

      {open && (
        <div className="px-5 py-4 bg-gray-950 border-t border-gray-800">
          {row.travels.length === 0
            ? <p className="text-gray-500 text-sm text-center py-4">No travel requests yet.</p>
            : row.travels.map((trip, i) => <TripRow key={trip._id} trip={trip} idx={i+1}/>)
          }
        </div>
      )}
    </div>
  );
};

// ── Approve/Reject Modal ─────────────────────────────────────────────────────
const ApprovalModal = ({ travel, onClose, onDone }) => {
  const [note, setNote]     = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  const act = async (action) => {
    if (action === 'reject' && !note.trim()) return setError('Reason is required for rejection.');
    setBusy(true); setError('');
    try {
      await API.put(`/admin/travels/${travel._id}/${action}`, { note });
      onDone();
    } catch(e) { setError(e.response?.data?.message || 'Failed'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Review Travel Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <p className="text-white font-medium">{travel.employee?.name}</p>
            <p className="text-gray-400 text-sm">{travel.from} → {travel.destination}</p>
            <p className="text-gray-400 text-sm">{fmtDt(travel.fromDate)} — {fmtDt(travel.toDate)}</p>
            <p className="text-gray-400 text-sm">Purpose: {travel.purpose}</p>
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          <textarea value={note} onChange={e=>{ setNote(e.target.value); setError(''); }}
            placeholder="Add note (required for rejection)..." rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none transition"/>
          <div className="flex gap-3">
            <button onClick={() => act('approve')} disabled={busy}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
              <CheckCircle size={16}/> Approve
            </button>
            <button onClick={() => act('reject')} disabled={busy}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
              <XCircle size={16}/> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TravelList() {
  const [summary,  setSummary]  = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [tab,      setTab]      = useState('summary'); // 'summary' | 'pending'
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([
        API.get('/admin/travel-summary'),
        API.get('/admin/travels'),
      ]);
      setSummary(s.data);
      setPending(p.data.filter(t => t.status === 'pending'));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filteredSummary = summary.filter(r =>
    r.user.name.toLowerCase().includes(search.toLowerCase()) ||
    r.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pending.filter(t =>
    t.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.destination?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Travel List</h1>
        <p className="text-gray-400 text-sm mt-1">Employee travel history & pending approvals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('summary')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2
            ${tab==='summary' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <Users size={15}/> Employee Summary ({summary.length})
        </button>
        <button onClick={() => setTab('pending')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2
            ${tab==='pending' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          <Plane size={15}/> Pending Approvals ({pending.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={tab==='summary' ? 'Search employee...' : 'Search employee or destination...'}
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && (
        <div>
          {filteredSummary.length === 0
            ? <div className="text-center text-gray-500 py-16">No employees found.</div>
            : filteredSummary.map(row => <EmpRow key={row.user._id} row={row}/>)
          }
        </div>
      )}

      {/* Pending Approvals Tab */}
      {tab === 'pending' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {filteredPending.length === 0
            ? <div className="text-center text-gray-500 py-16 text-sm">No pending travel requests.</div>
            : <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-800/50">
                      {['Employee','Route','Purpose','Dates','Advance','Action'].map(h => (
                        <th key={h} className="text-left text-gray-400 font-medium px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map(t => (
                      <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {t.employee?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white">{t.employee?.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-300 text-xs">{t.from} → {t.destination}</td>
                        <td className="px-5 py-4 text-gray-400">{t.purpose}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">{fmtDt(t.fromDate)}<br/>{fmtDt(t.toDate)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.advanceMoney ? 'bg-orange-500/10 text-orange-400' : 'bg-gray-700 text-gray-500'}`}>
                            {t.advanceMoney ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => setSelected(t)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition">
                            Review <ChevronRight size={14}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {selected && (
        <ApprovalModal
          travel={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
