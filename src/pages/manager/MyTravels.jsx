// Manager's own travel history — same as employee TravelManage
// Manager can view their own trips, submit requests, add expenses
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Plus, Wallet, X, Loader, FileText, ChevronRight } from 'lucide-react';
import API from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge, SerialNo, LoadingScreen, EmptyState, fmtDate, SA, SearchInput } from '../../components/employee/shared.jsx';

const LS = {
  label: { display:'block', color:'#9ca3af', fontSize:'11px', fontWeight:500, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' },
  input: { width:'100%', background:'#111827', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px 16px', fontSize:'14px', color:'#fff', outline:'none', transition:'border-color 0.15s', boxSizing:'border-box', fontFamily:'inherit' },
};
const fi = e => { e.target.style.borderColor='rgba(139,92,246,0.6)'; };
const fo = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; };

const STATUS_TABS = ['all','pending','approved','booked','completed','rejected','cancelled'];

const NewTravelModal = ({ onClose, onSuccess }) => {
  const [bookingType,  setBookingType]  = useState('hr');
  const [wantsAdvance, setWantsAdvance] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const fromRef=useRef(), destRef=useRef(), purposeRef=useRef();
  const fromDateRef=useRef(), toDateRef=useRef(), advAmtRef=useRef(), advReasonRef=useRef();

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!fromRef.current.value.trim())    return SA.error('Missing','Enter From location.');
    if (!destRef.current.value.trim())    return SA.error('Missing','Enter Destination.');
    if (!purposeRef.current.value.trim()) return SA.error('Missing','Enter Purpose.');
    if (!fromDateRef.current.value)       return SA.error('Missing','Select Departure Date.');
    if (!toDateRef.current.value)         return SA.error('Missing','Select Return Date.');
    setSaving(true);
    try {
      const { data: travel } = await API.post('/travel', {
        from: fromRef.current.value.trim(), destination: destRef.current.value.trim(),
        purpose: purposeRef.current.value.trim(), fromDate: fromDateRef.current.value,
        toDate: toDateRef.current.value, bookingType,
      });
      let advanceSent = false;
      if (wantsAdvance && advAmtRef.current?.value) {
        try {
          await API.post('/advance', { amount: Number(advAmtRef.current.value), reason: advReasonRef.current?.value?.trim() || 'Advance required', travelRequest: travel._id });
          advanceSent = true;
        } catch (_) {}
      }
      onSuccess(advanceSent);
    } catch (err) {
      SA.error('Failed', err.response?.data?.message || 'Something went wrong');
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'48px 16px 32px', overflowY:'auto' }}>
      <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', width:'100%', maxWidth:'460px', margin:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color:'#fff', fontWeight:600, fontSize:'15px' }}>✈️ New Travel Request</span>
          <button type="button" onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', padding:'4px' }}><X size={18}/></button>
        </div>
        <form onSubmit={submit} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label style={LS.label}>From Location</label><input ref={fromRef} style={LS.input} placeholder="Ahmedabad" autoComplete="off" onFocus={fi} onBlur={fo}/></div>
            <div><label style={LS.label}>Destination</label><input ref={destRef} style={LS.input} placeholder="Mumbai" autoComplete="off" onFocus={fi} onBlur={fo}/></div>
          </div>
          <div><label style={LS.label}>Purpose of Travel</label><input ref={purposeRef} style={LS.input} placeholder="Client Meeting / Site Visit" autoComplete="off" onFocus={fi} onBlur={fo}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div><label style={LS.label}>Departure Date</label><input ref={fromDateRef} type="date" style={LS.input} onFocus={fi} onBlur={fo}/></div>
            <div><label style={LS.label}>Return Date</label><input ref={toDateRef} type="date" style={LS.input} onFocus={fi} onBlur={fo}/></div>
          </div>
          <div>
            <label style={LS.label}>Booking Preference</label>
            <select value={bookingType} onChange={e=>setBookingType(e.target.value)} style={{ ...LS.input, cursor:'pointer' }}>
              <option value="hr">🏢 HR will book tickets</option>
              <option value="self">🙋 I will book myself</option>
            </select>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'16px' }}>
            <button type="button" onClick={() => setWantsAdvance(v=>!v)}
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', padding:0 }}>
              <div style={{ width:'36px', height:'20px', borderRadius:'10px', background:wantsAdvance?'#8b5cf6':'#374151', display:'flex', alignItems:'center', padding:'2px', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transform:wantsAdvance?'translateX(16px)':'translateX(0)', transition:'transform 0.2s' }}/>
              </div>
              <span style={{ color:'#d1d5db', fontSize:'14px' }}><Wallet size={15} color="#8b5cf6" style={{ display:'inline', marginRight:'6px' }}/>Request advance money</span>
            </button>
            {wantsAdvance && (
              <div style={{ marginTop:'12px', padding:'16px', background:'rgba(139,92,246,0.05)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'12px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <div><label style={LS.label}>Amount (₹)</label><input ref={advAmtRef} type="number" min="1" style={LS.input} placeholder="5000" onFocus={fi} onBlur={fo}/></div>
                <div><label style={LS.label}>Reason</label><textarea ref={advReasonRef} rows={2} style={{ ...LS.input, resize:'none', height:'auto' }} placeholder="Why do you need advance?" onFocus={fi} onBlur={fo}/></div>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving}
            style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:saving?'#4c1d95':'#7c3aed', color:'#fff', fontWeight:600, fontSize:'14px', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {saving ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Submitting...</> : '🚀 Submit Travel Request'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
};

export default function ManagerMyTravels() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [tab,     setTab]     = useState('all');
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    try { const { data } = await API.get('/travel'); setTravels(data.filter(t => t.employee?._id === user?._id || t.employee === user?._id)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s==='all' ? travels.length : travels.filter(t=>t.status===s).length;
    return acc;
  }, {});

  const filtered = travels
    .filter(t => tab==='all' || t.status===tab)
    .filter(t => !search || t.destination?.toLowerCase().includes(search.toLowerCase()) || t.from?.toLowerCase().includes(search.toLowerCase()) || t.purpose?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingScreen color="border-purple-500"/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">My Travels</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your personal travel requests</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-purple-500/20">
          <Plus size={17}/> New Request
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.filter(s => counts[s] > 0 || s==='all').map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${tab===s ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search by destination, route or purpose..."/>

      {filtered.length === 0
        ? <EmptyState message={travels.length===0 ? "No travel requests yet." : "No trips match your filter."} onAction={travels.length===0 ? () => setShowNew(true) : undefined} actionLabel="+ Create your first"/>
        : (
          <div className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['#','Route','Purpose','Dates','Booking','Status',''].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium py-3 px-4 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t,i) => (
                  <tr key={t._id} onClick={() => navigate(`/manager/my-travels/${t._id}`)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition cursor-pointer group">
                    <td className="py-3 px-4"><SerialNo n={i+1}/></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-purple-400"/>
                        </div>
                        <p className="text-white font-medium whitespace-nowrap">{t.from} → {t.destination}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 max-w-[160px] truncate">{t.purpose}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.fromDate)}<br/><span className="text-gray-700">{fmtDate(t.toDate)}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{t.bookingType==='hr'?'🏢 HR':'🙋 Self'}</td>
                    <td className="py-3 px-4"><StatusBadge status={t.status}/></td>
                    <td className="py-3 px-4"><ChevronRight size={15} className="text-gray-700 group-hover:text-gray-400 transition"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {showNew && (
        <NewTravelModal onClose={() => setShowNew(false)} onSuccess={(adv) => { setShowNew(false); load(); SA.success('✈️ Submitted!', adv ? 'Travel + advance submitted.' : 'Travel request submitted.'); }}/>
      )}
    </div>
  );
}
