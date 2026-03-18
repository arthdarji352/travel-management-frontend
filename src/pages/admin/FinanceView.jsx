import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../../api/axios.js';

const fmt   = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtDt = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const CAT_LABELS = { travel:'✈ Travel', taxi:'🚕 Taxi', hotel:'🏨 Hotel', food:'🍽 Food', other:'📦 Other' };

const StatusBadge = ({ status }) => {
  const map = { pending:'bg-yellow-500/10 text-yellow-400', approved:'bg-green-500/10 text-green-400',
    rejected:'bg-red-500/10 text-red-400', booked:'bg-blue-500/10 text-blue-400',
    completed:'bg-purple-500/10 text-purple-400' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status]||'bg-gray-500/10 text-gray-400'}`}>{status}</span>;
};

const BreakdownGrid = ({ breakdown, label='All Expenses' }) => (
  <div className="mt-3">
    <p className="text-gray-500 text-xs mb-2">{label}</p>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {Object.entries(CAT_LABELS).map(([k,l]) => (
        <div key={k} className="bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-gray-400 text-xs mb-0.5">{l}</p>
          <p className="text-white text-xs font-semibold">{fmt(breakdown?.[k]||0)}</p>
        </div>
      ))}
      <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-2 text-center">
        <p className="text-green-400 text-xs mb-0.5">💰 Total</p>
        <p className="text-green-300 text-xs font-bold">{fmt(breakdown?.total||0)}</p>
      </div>
    </div>
  </div>
);

const TripRow = ({ trip, idx }) => {
  const [open, setOpen] = useState(false);
  const hasExpenses = trip.expenses?.length > 0;
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden mb-2">
      <button onClick={() => setOpen(p=>!p)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition text-left">
        <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">{idx}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{trip.from} → {trip.destination}</p>
          <p className="text-gray-400 text-xs">{fmtDt(trip.fromDate)} — {fmtDt(trip.toDate)} · {trip.purpose}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={trip.status}/>
          <div className="text-right hidden sm:block">
            <p className="text-green-400 text-xs font-semibold">{fmt(trip.breakdown?.total)} approved</p>
            <p className="text-gray-500 text-xs">{fmt(trip.allBreakdown?.total)} total</p>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 bg-gray-900">
          {!hasExpenses
            ? <p className="text-gray-600 text-xs mt-3 pt-3 border-t border-gray-700">No expenses for this trip.</p>
            : <>
                <BreakdownGrid breakdown={trip.breakdown} label="Approved Expenses"/>
                {trip.allBreakdown?.total !== trip.breakdown?.total &&
                  <BreakdownGrid breakdown={trip.allBreakdown} label="All Submitted Expenses"/>
                }
                {/* Individual expenses */}
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                  {trip.expenses.map(e => (
                    <div key={e._id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-800">
                      <span className="text-gray-400 capitalize">{CAT_LABELS[e.category] || e.category}</span>
                      <span className="text-gray-400 truncate max-w-[160px] mx-2">{e.description || '—'}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize
                          ${e.status==='approved'?'bg-green-500/10 text-green-400':e.status==='rejected'?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>
                          {e.status}
                        </span>
                        <span className="text-white font-medium">{fmt(e.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      )}
    </div>
  );
};

const EmpRow = ({ row }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(p=>!p)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-gray-900 hover:bg-gray-800/60 transition text-left">
        <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
            <p className="text-green-400 font-bold text-sm">{fmt(row.totalApprovedExpenses)}</p>
            <p className="text-gray-500 text-xs">Approved</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-gray-300 font-bold text-sm">{fmt(row.totalAllExpenses)}</p>
            <p className="text-gray-500 text-xs">Submitted</p>
          </div>
          {open ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
        </div>
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-950 border-t border-gray-800">
          {row.travels.length === 0
            ? <p className="text-gray-500 text-sm text-center py-4">No travels yet.</p>
            : row.travels.map((trip, i) => <TripRow key={trip._id} trip={trip} idx={i+1}/>)
          }
        </div>
      )}
    </div>
  );
};

export default function FinanceView() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    API.get('/admin/finance-summary')
      .then(r => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = summary.filter(r =>
    r.user.name.toLowerCase().includes(search.toLowerCase()) ||
    r.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalApproved = summary.reduce((s,r) => s + r.totalApprovedExpenses, 0);
  const totalAll      = summary.reduce((s,r) => s + r.totalAllExpenses, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Finance Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Employee-wise expense breakdown across all trips</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Total Employees', value: summary.length,     color:'bg-blue-600'  },
          { label:'Approved Expenses', value: `₹${Number(totalApproved).toLocaleString('en-IN')}`, color:'bg-green-600' },
          { label:'All Submitted',   value: `₹${Number(totalAll).toLocaleString('en-IN')}`,      color:'bg-gray-600'  },
        ].map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center`}>
              <span className="text-white text-lg font-bold">₹</span>
            </div>
            <div>
              <p className="text-gray-400 text-xs">{c.label}</p>
              <p className="text-white font-bold text-lg">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"/>
      </div>

      {filtered.length === 0
        ? <div className="text-center text-gray-500 py-16">No employees found.</div>
        : filtered.map(row => <EmpRow key={row.user._id} row={row}/>)
      }
    </div>
  );
}
