import { useEffect, useState, useCallback } from 'react';
import { Search, Plane, MapPin, Calendar, Eye, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import API from '../../api/axios.js';

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const StatusBadge = ({ status }) => {
  const map = {
    pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
    rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
    booked:    'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{status}</span>;
};

// Simple detail view modal (read-only for HR)
const ViewModal = ({ travel, onClose }) => {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-semibold">Travel Details</h3>
            <p className="text-gray-500 text-xs mt-0.5">{travel.employee?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={travel.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 ml-1"><X size={18}/></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Employee', val: travel.employee?.name },
              { label: 'Email',    val: travel.employee?.email },
              { label: 'From',     val: travel.from },
              { label: 'To',       val: travel.destination },
              { label: 'Depart',   val: fmtDate(travel.fromDate) },
              { label: 'Return',   val: fmtDate(travel.toDate) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-900/60 rounded-xl p-3">
                <p className="text-gray-600 text-[10px] uppercase tracking-wide">{label}</p>
                <p className="text-white text-sm mt-1">{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/60 rounded-xl p-3">
            <p className="text-gray-600 text-[10px] uppercase tracking-wide">Purpose</p>
            <p className="text-white text-sm mt-1">{travel.purpose}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/60 rounded-xl p-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide">Booking Type</p>
              <p className="text-white text-sm mt-1">{travel.bookingType === 'self' ? '🙋 Self booking' : '🏢 HR booking'}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide">Ticket Uploaded</p>
              <p className="text-white text-sm mt-1">{travel.ticketFile ? '✅ Yes' : '❌ Not yet'}</p>
            </div>
          </div>

          {travel.managerNote && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-yellow-400 text-xs font-medium">Manager Note</p>
              <p className="text-gray-300 text-sm mt-0.5">{travel.managerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const AllTravels = () => {
  const [travels,  setTravels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try { const { data } = await API.get('/travel'); setTravels(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    all:      travels.length,
    approved: travels.filter(t => t.status === 'approved').length,
    booked:   travels.filter(t => t.status === 'booked').length,
    completed:travels.filter(t => t.status === 'completed').length,
    rejected: travels.filter(t => t.status === 'rejected').length,
  };

  const filtered = travels
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t =>
      t.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase()) ||
      t.from?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-white text-2xl font-bold">All Travels</h1>
        <p className="text-gray-500 text-sm mt-0.5">{travels.length} total travel requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, cnt]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${filter === key ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
            {key} ({cnt})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employee, from, destination..."
          className="w-full bg-[#0d1117] border border-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition placeholder-gray-600" />
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-16 text-sm">
            <Plane size={36} className="mx-auto mb-3 text-gray-700" />
            No travels found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Employee', 'Route', 'Dates', 'Booking', 'Ticket', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {t.employee?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm">{t.employee?.name}</p>
                          <p className="text-gray-600 text-xs">{t.employee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 text-sm whitespace-nowrap">{t.from} → {t.destination}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(t.fromDate).toLocaleDateString('en-IN')} – {new Date(t.toDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{t.bookingType === 'self' ? '🙋 Self' : '🏢 HR'}</td>
                    <td className="px-5 py-3.5 text-xs">{t.ticketFile ? <span className="text-green-400">✅ Uploaded</span> : <span className="text-gray-600">—</span>}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(t)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition">
                        <Eye size={12}/> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <ViewModal travel={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default AllTravels;
