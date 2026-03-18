import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle, XCircle, Eye, MapPin, Calendar,
  AlertCircle, X, Loader, ChevronDown, ChevronUp,
  FileText, Download, Search,
} from 'lucide-react';
import API from '../../api/axios.js';
import Swal from 'sweetalert2';

const SA = {
  success: (t, tx) => Swal.fire({ icon: 'success', title: t, text: tx, background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' }),
  error:   (t, tx) => Swal.fire({ icon: 'error',   title: t, text: tx, background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' }),
};

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const StatusBadge = ({ status }) => {
  const map = {
    pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    booked:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed:'bg-gray-500/10 text-gray-400 border-gray-500/20',
    cancelled:'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{status}</span>;
};

const catIcon = { travel: '✈️', taxi: '🚕', hotel: '🏨', food: '🍔', other: '📦' };

// ── Detail Modal (portal, no backdrop click close) ────────────────────────────
const DetailModal = ({ travel, expenses, onClose, onAction }) => {
  const [saving, setSaving] = useState('');
  const noteRef = useRef();

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const approve = async () => {
    setSaving('approve');
    try {
      await API.put(`/travel/${travel._id}/approve`, { note: noteRef.current?.value || '' });
      SA.success('Travel Approved!', travel.bookingType === 'self' ? 'Employee can now add expenses.' : 'HR will be notified to book tickets.');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  const reject = async () => {
    const note = noteRef.current?.value?.trim();
    if (!note) { SA.error('Note Required', 'Please add a reason for rejection.'); return; }
    setSaving('reject');
    try {
      await API.put(`/travel/${travel._id}/reject`, { note });
      SA.success('Travel Rejected', 'Employee has been notified.');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  const approveExpense = async (expId) => {
    try {
      await API.put(`/expense/${expId}/approve`);
      SA.success('Expense Approved!', '');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const rejectExpense = async (expId) => {
    try {
      await API.put(`/expense/${expId}/reject`);
      SA.success('Expense Rejected', '');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const downloadPDF = async () => {
    try {
      const res = await API.get(`/report/${travel._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: `expense-report-${travel.destination}-${travel._id.slice(-5)}.pdf` }).click();
      URL.revokeObjectURL(url);
    } catch (_) { SA.error('Failed', 'Could not generate PDF.'); }
  };

  const totalExp   = expenses.reduce((s, e) => s + e.amount, 0);
  const approvedExp = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 32px', overflowY: 'auto' }}>
      <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '640px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', margin: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-semibold">Travel Request Details</h3>
            <p className="text-gray-500 text-xs mt-0.5">{travel.employee?.name} · {travel.employee?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={travel.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 ml-2"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Trip info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { Icon: MapPin,   label: 'From',        val: travel.from },
              { Icon: MapPin,   label: 'Destination', val: travel.destination },
              { Icon: Calendar, label: 'Depart',      val: fmtDate(travel.fromDate) },
              { Icon: Calendar, label: 'Return',      val: fmtDate(travel.toDate) },
            ].map(({ Icon, label, val }) => (
              <div key={label} className="bg-gray-900/60 rounded-xl p-3">
                <p className="text-gray-600 text-[10px] flex items-center gap-1 uppercase tracking-wide"><Icon size={10}/> {label}</p>
                <p className="text-white text-sm font-medium mt-1">{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/60 rounded-xl p-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide">Purpose</p>
              <p className="text-white text-sm mt-1">{travel.purpose}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3">
              <p className="text-gray-600 text-[10px] uppercase tracking-wide">Booking</p>
              <p className="text-white text-sm mt-1">{travel.bookingType === 'self' ? '🙋 Self booking' : '🏢 HR will book'}</p>
            </div>
          </div>

          {/* Expenses section */}
          {expenses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-semibold">Expense Claims</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">Total: <span className="text-white font-medium">₹{totalExp.toLocaleString()}</span></span>
                  <span className="text-gray-500">Approved: <span className="text-green-400 font-medium">₹{approvedExp.toLocaleString()}</span></span>
                </div>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {expenses.map(exp => (
                  <div key={exp._id} className="bg-gray-900 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{catIcon[exp.category]}</span>
                        <div>
                          <p className="text-white text-sm font-medium capitalize">{exp.category}</p>
                          {exp.description && <p className="text-gray-500 text-xs">{exp.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">₹{exp.amount.toLocaleString()}</span>
                        <StatusBadge status={exp.status} />
                        {exp.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => approveExpense(exp._id)}
                              className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition" title="Approve">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => rejectExpense(exp._id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition" title="Reject">
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {exp.billProof && (
                      <a
                        href={`http://localhost:5000/uploads/bills/${exp.billProof}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        📎 View Bill Proof
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download PDF (only when booked) */}
          {(travel.status === 'booked' || travel.status === 'completed') && (
            <button onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-medium transition w-full justify-center">
              <Download size={16} /> Download Expense PDF Report
            </button>
          )}

          {/* Approve / Reject — only for pending */}
          {travel.status === 'pending' && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                  Note / Reason <span className="text-gray-600 normal-case">(required for rejection)</span>
                </label>
                <textarea
                  ref={noteRef}
                  rows={2}
                  placeholder="Add a note for the employee..."
                  className="w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition resize-none placeholder-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={approve} disabled={!!saving}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
                  {saving === 'approve' ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Approve
                </button>
                <button onClick={reject} disabled={!!saving}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">
                  {saving === 'reject' ? <Loader size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TravelApprovals = () => {
  const [travels,      setTravels]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('all');
  const [selected,     setSelected]     = useState(null);
  const [selExpenses,  setSelExpenses]  = useState([]);

  const load = useCallback(async () => {
    try { const { data } = await API.get('/travel'); setTravels(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (t) => {
    setSelected(t);
    try { const { data } = await API.get(`/expense/${t._id}`); setSelExpenses(data); }
    catch (_) { setSelExpenses([]); }
  };

  const handleAction = () => {
    load();
    // Refresh expenses for the currently open travel
    if (selected) {
      API.get(`/expense/${selected._id}`)
        .then(r => setSelExpenses(r.data))
        .catch(() => {});
      // Refresh the selected travel's status
      API.get(`/travel/${selected._id}`)
        .then(r => setSelected(r.data))
        .catch(() => {});
    }
  };

  const counts = {
    all:      travels.length,
    pending:  travels.filter(t => t.status === 'pending').length,
    approved: travels.filter(t => t.status === 'approved').length,
    booked:   travels.filter(t => t.status === 'booked').length,
    rejected: travels.filter(t => t.status === 'rejected').length,
    completed:travels.filter(t => t.status === 'completed').length,
  };

  const filtered = travels
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t =>
      t.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination?.toLowerCase().includes(search.toLowerCase()) ||
      t.from?.toLowerCase().includes(search.toLowerCase()) ||
      t.purpose?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-white text-2xl font-bold">Travel Approvals</h1>
        <p className="text-gray-500 text-sm mt-0.5">{counts.pending} pending approval</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize ${filter === key ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
            {key} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employee, route, purpose..."
          className="w-full bg-[#0d1117] border border-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition placeholder-gray-600" />
      </div>

      {/* Table */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-16 text-sm">No travel requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Employee', 'Route', 'Purpose', 'Dates', 'Booking', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs font-medium uppercase tracking-wide px-5 py-3">{h}</th>
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
                          <p className="text-white text-sm font-medium">{t.employee?.name}</p>
                          <p className="text-gray-600 text-xs">{t.employee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 text-sm">{t.from} → {t.destination}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-sm max-w-32 truncate">{t.purpose}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(t.fromDate).toLocaleDateString()} – {new Date(t.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{t.bookingType === 'self' ? '🙋 Self' : '🏢 HR'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openDetail(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          travel={selected}
          expenses={selExpenses}
          onClose={() => { setSelected(null); setSelExpenses([]); }}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default TravelApprovals;
