import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plane, Upload, CheckCircle, X, Loader,
  MapPin, Calendar, Search, Ticket, AlertTriangle,
} from 'lucide-react';
import API from '../../api/axios.js';
import Swal from 'sweetalert2';

const SA = {
  success: (t, tx) => Swal.fire({ icon: 'success', title: t, text: tx, background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' }),
  error:   (t, tx) => Swal.fire({ icon: 'error',   title: t, text: tx, background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' }),
};

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Book Modal ─────────────────────────────────────────────────────────────────
const BookModal = ({ travel, onClose, onBooked }) => {
  const [file,       setFile]       = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done,       setDone]       = useState(false); // prevent double submit

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  // Step 1 — user clicks "Confirm Booking" → show inline confirm UI
  const handleBookClick = () => {
    setConfirming(true);
  };

  // Step 2 — user clicks "Yes, Book Now" in inline confirm
  const doBook = async () => {
    if (done || saving) return;
    setConfirming(false);
    setSaving(true);
    setDone(true);
    try {
      const fd = new FormData();
      if (file) fd.append('ticket', file);

      await API.put(`/hr/book/${travel._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onBooked();
      SA.success('Travel Booked! 🎫', `${travel.employee?.name}'s travel to ${travel.destination} is booked. Employee notified.`);
    } catch (err) {
      setDone(false);
      setSaving(false);
      SA.error('Booking Failed', err.response?.data?.message || 'Something went wrong. Try again.');
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', width: '100%', maxWidth: '520px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-semibold">🎫 Book Travel</h3>
            <p className="text-gray-500 text-xs mt-0.5">Review details and confirm booking</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-white transition p-1 disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Employee */}
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {travel.employee?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{travel.employee?.name}</p>
              <p className="text-blue-300 text-xs">{travel.employee?.email}</p>
            </div>
          </div>

          {/* Trip details */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'From',        val: travel.from,                       Icon: MapPin   },
              { label: 'Destination', val: travel.destination,                Icon: MapPin   },
              { label: 'Departure',   val: fmtDate(travel.fromDate),          Icon: Calendar },
              { label: 'Return',      val: fmtDate(travel.toDate),            Icon: Calendar },
            ].map(({ label, val, Icon }) => (
              <div key={label} className="bg-gray-900/60 rounded-xl p-3">
                <p className="text-gray-600 text-[10px] uppercase tracking-wide flex items-center gap-1">
                  <Icon size={9} /> {label}
                </p>
                <p className="text-white text-sm font-medium mt-1">{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/60 rounded-xl p-3">
            <p className="text-gray-600 text-[10px] uppercase tracking-wide">Purpose</p>
            <p className="text-white text-sm mt-1">{travel.purpose}</p>
          </div>

          {travel.managerNote && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-yellow-400 text-xs font-medium">Manager Note</p>
              <p className="text-gray-300 text-sm mt-0.5">{travel.managerNote}</p>
            </div>
          )}

          {/* Ticket upload */}
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
              Upload Ticket <span className="text-gray-600 normal-case">(optional)</span>
            </p>
            <label className="flex items-center gap-3 bg-gray-900 border border-white/10 border-dashed rounded-xl px-4 py-4 cursor-pointer hover:border-green-500/40 transition group">
              <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{file ? file.name : 'Click to upload ticket'}</p>
                <p className="text-gray-600 text-xs">PDF, JPG, PNG — max 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => { setFile(e.target.files[0]); setConfirming(false); }}
              />
            </label>
            {file && (
              <div className="flex items-center justify-between mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <span className="text-green-400 text-xs flex items-center gap-1.5">
                  <Ticket size={12} /> {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => { setFile(null); setConfirming(false); }}
                  className="text-gray-500 hover:text-red-400 transition"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* ── Inline confirm step ── */}
          {confirming ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle size={16} />
                <p className="text-sm font-semibold">Confirm this booking?</p>
              </div>
              <p className="text-gray-400 text-xs">
                This will mark the travel as <span className="text-white font-medium">Booked</span> and notify the employee.
                {file && <span className="text-green-400"> Ticket will be uploaded.</span>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={doBook}
                  className="py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Yes, Book Now
                </button>
              </div>
            </div>
          ) : saving ? (
            <div className="w-full flex items-center justify-center gap-2 bg-green-900/40 text-green-400 font-semibold py-3 rounded-xl text-sm">
              <Loader size={16} className="animate-spin" /> Processing booking...
            </div>
          ) : (
            <button
              onClick={handleBookClick}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-green-500/20"
            >
              <CheckCircle size={16} /> Confirm Booking
            </button>
          )}

          {!confirming && !saving && (
            <p className="text-gray-600 text-xs text-center">
              Employee will be notified once booking is confirmed.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const BookTravel = () => {
  const [travels,  setTravels]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/hr/pending');
      setTravels(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = travels.filter(t =>
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
        <h1 className="text-white text-2xl font-bold">Book Travel</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {travels.length === 0
            ? 'No pending bookings right now'
            : `${travels.length} approved travel${travels.length > 1 ? 's' : ''} waiting for HR booking`}
        </p>
      </div>

      {travels.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee or destination..."
            className="w-full bg-[#0d1117] border border-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition placeholder-gray-600"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl py-24 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-gray-500 text-sm mt-1">No approved travels waiting for booking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t._id} className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 hover:border-yellow-500/30 transition group">

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {t.employee?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.employee?.name}</p>
                    <p className="text-gray-500 text-xs">{t.employee?.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20 whitespace-nowrap">
                  Awaiting booking
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gray-900/60 rounded-xl px-3 py-2.5 mb-3">
                <Plane size={14} className="text-blue-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{t.from}</span>
                <span className="text-gray-600 mx-1">→</span>
                <span className="text-white text-sm font-medium">{t.destination}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-900/40 rounded-lg px-3 py-2">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wide">Depart</p>
                  <p className="text-gray-300 text-xs font-medium mt-0.5">{fmtDate(t.fromDate)}</p>
                </div>
                <div className="bg-gray-900/40 rounded-lg px-3 py-2">
                  <p className="text-gray-600 text-[10px] uppercase tracking-wide">Return</p>
                  <p className="text-gray-300 text-xs font-medium mt-0.5">{fmtDate(t.toDate)}</p>
                </div>
              </div>

              <p className="text-gray-500 text-xs mb-4 truncate">{t.purpose}</p>

              <button
                onClick={() => setSelected(t)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-green-500/10"
              >
                <Ticket size={15} /> Book This Travel
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BookModal
          travel={selected}
          onClose={() => setSelected(null)}
          onBooked={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
};

export default BookTravel;
