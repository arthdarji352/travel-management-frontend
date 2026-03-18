// HR Travel Approvals — same as manager TravelApprovals
// HR can approve/reject travels when manager is unavailable
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Eye, MapPin, Calendar, X, Loader, Download } from 'lucide-react';
import API from '../../api/axios.js';
import { SA, StatusBadge, LoadingScreen, SearchInput, fmtDate, fmtMoney } from '../../components/employee/shared.jsx';

const CAT_ICON = { travel:'✈️', taxi:'🚕', hotel:'🏨', food:'🍔', other:'📦' };

const DetailModal = ({ travel, expenses, onClose, onAction }) => {
  const [saving, setSaving] = useState('');
  const noteRef = useRef();

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const approve = async () => {
    setSaving('approve');
    try {
      await API.put(`/travel/${travel._id}/approve`, { note: noteRef.current?.value || '' });
      SA.success('Travel Approved!', travel.bookingType==='self' ? 'Employee can now add expenses.' : 'HR will book tickets.');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  const reject = async () => {
    if (!noteRef.current?.value?.trim()) return SA.error('Note Required', 'Please add a reason for rejection.');
    setSaving('reject');
    try {
      await API.put(`/travel/${travel._id}/reject`, { note: noteRef.current.value });
      SA.success('Travel Rejected', 'Employee notified.');
      onAction();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
    finally { setSaving(''); }
  };

  const approveExpense = async (expId) => {
    try { await API.put(`/expense/${expId}/approve`); SA.success('Expense Approved!',''); onAction(); }
    catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const rejectExpense = async (expId) => {
    try { await API.put(`/expense/${expId}/reject`); SA.success('Expense Rejected',''); onAction(); }
    catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const downloadPDF = async () => {
    try {
      const res = await API.get(`/report/${travel._id}/pdf`, { responseType:'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      Object.assign(document.createElement('a'), { href:url, download:`expense-report-${travel.destination}.pdf` }).click();
      URL.revokeObjectURL(url);
    } catch { SA.error('Failed','Could not generate PDF.'); }
  };

  const totalExp    = expenses.reduce((s,e)=>s+e.amount,0);
  const approvedExp = expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px 32px', overflowY:'auto' }}>
      <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', width:'100%', maxWidth:'640px', margin:'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="text-white font-semibold">Travel Request Details</h3>
            <p className="text-gray-500 text-xs mt-0.5">{travel.employee?.name} · {travel.employee?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={travel.status}/>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 ml-2"><X size={18}/></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{Icon:MapPin,label:'From',val:travel.from},{Icon:MapPin,label:'To',val:travel.destination},{Icon:Calendar,label:'Depart',val:fmtDate(travel.fromDate)},{Icon:Calendar,label:'Return',val:fmtDate(travel.toDate)}].map(({Icon,label,val})=>(
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
              <p className="text-white text-sm mt-1">{travel.bookingType==='self'?'🙋 Self':'🏢 HR'}</p>
            </div>
          </div>

          {expenses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-semibold">Expense Claims</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-gray-500">Total: <span className="text-white font-medium">{fmtMoney(totalExp)}</span></span>
                  <span className="text-gray-500">Approved: <span className="text-green-400 font-medium">{fmtMoney(approvedExp)}</span></span>
                </div>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {expenses.map(exp => (
                  <div key={exp._id} className="bg-gray-900 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CAT_ICON[exp.category]}</span>
                        <div>
                          <p className="text-white text-sm font-medium capitalize">{exp.category}</p>
                          {exp.description && <p className="text-gray-500 text-xs">{exp.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">{fmtMoney(exp.amount)}</span>
                        <StatusBadge status={exp.status}/>
                        {exp.status==='pending' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => approveExpense(exp._id)} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition" title="Approve"><CheckCircle size={14}/></button>
                            <button onClick={() => rejectExpense(exp._id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition" title="Reject"><XCircle size={14}/></button>
                          </div>
                        )}
                      </div>
                    </div>
                    {exp.billProof && (
                      <a href={`http://localhost:5000/uploads/bills/${exp.billProof}`} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition">📎 View Bill Proof</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(travel.status==='booked'||travel.status==='completed') && (
            <button onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-medium w-full justify-center transition">
              <Download size={16}/> Download Expense PDF
            </button>
          )}

          {travel.status==='pending' && (
            <div className="border-t border-white/5 pt-4 space-y-3">
              <textarea ref={noteRef} rows={2} placeholder="Add a note (required for rejection)..."
                className="w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500/60 resize-none placeholder-gray-600"/>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={approve} disabled={!!saving}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
                  {saving==='approve'?<Loader size={15} className="animate-spin"/>:<CheckCircle size={15}/>} Approve
                </button>
                <button onClick={reject} disabled={!!saving}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
                  {saving==='reject'?<Loader size={15} className="animate-spin"/>:<XCircle size={15}/>} Reject
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

export default function HRTravelApprovals() {
  const [travels,     setTravels]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [selected,    setSelected]    = useState(null);
  const [selExpenses, setSelExpenses] = useState([]);

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
    if (selected) {
      API.get(`/expense/${selected._id}`).then(r => setSelExpenses(r.data)).catch(()=>{});
      API.get(`/travel/${selected._id}`).then(r => setSelected(r.data)).catch(()=>{});
    }
  };

  const counts = {
    all: travels.length,
    pending:   travels.filter(t=>t.status==='pending').length,
    approved:  travels.filter(t=>t.status==='approved').length,
    booked:    travels.filter(t=>t.status==='booked').length,
    rejected:  travels.filter(t=>t.status==='rejected').length,
    completed: travels.filter(t=>t.status==='completed').length,
  };

  const filtered = travels
    .filter(t => filter==='all' || t.status===filter)
    .filter(t => !search || t.employee?.name?.toLowerCase().includes(search.toLowerCase()) || t.destination?.toLowerCase().includes(search.toLowerCase()) || t.purpose?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <LoadingScreen color="border-green-500"/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-white text-2xl font-bold">Travel Approvals</h1>
        <p className="text-gray-500 text-sm mt-0.5">{counts.pending} pending approval</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([key,count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition ${filter===key?'bg-green-600 text-white':'bg-gray-900 text-gray-400 hover:text-white border border-white/5'}`}>
            {key} ({count})
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search employee, route, purpose..."/>

      <div className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length===0 ? (
          <div className="text-center text-gray-600 py-16 text-sm">No travel requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Employee','Route','Purpose','Dates','Booking','Status','Action'].map(h=>(
                    <th key={h} className="text-left text-gray-500 text-xs font-medium uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.employee?.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-white text-sm font-medium">{t.employee?.name}</p>
                          <p className="text-gray-600 text-xs">{t.employee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 text-sm whitespace-nowrap">{t.from} → {t.destination}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-sm max-w-32 truncate">{t.purpose}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.fromDate)} – {fmtDate(t.toDate)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{t.bookingType==='self'?'🙋 Self':'🏢 HR'}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={t.status}/></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openDetail(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium transition">
                        <Eye size={13}/> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <DetailModal travel={selected} expenses={selExpenses} onClose={() => { setSelected(null); setSelExpenses([]); }} onAction={handleAction}/>}
    </div>
  );
}
