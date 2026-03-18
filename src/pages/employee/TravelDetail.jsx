import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, MapPin, Calendar, Download, CheckCircle2,
  ClipboardList, Upload, X, Loader, AlertCircle,
  Plus, ChevronDown, ChevronUp, Pencil, Trash2, Check,
} from 'lucide-react';
import API from '../../api/axios.js';
import {
  StatusBadge, LoadingScreen, InfoCell, fmtDate, fmtMoney, CAT_ICON, SA,
} from '../../components/employee/shared.jsx';

// ── constants ─────────────────────────────────────────────────────────────────
const CATS = [
  { value:'travel', label:'Travel', emoji:'✈️' },
  { value:'taxi',   label:'Taxi',   emoji:'🚕' },
  { value:'hotel',  label:'Hotel',  emoji:'🏨' },
  { value:'food',   label:'Food',   emoji:'🍽️' },
  { value:'other',  label:'Other',  emoji:'📦' },
];

// portal wrapper — click outside closes
const Overlay = ({ onClose, children }) => createPortal(
  <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 12px', overflowY:'auto' }}
    onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
    {children}
  </div>,
  document.body
);

// shared input style (portal-safe, no Tailwind purge)
const IS = {
  sel: { background:'#111827', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', color:'#fff', padding:'6px 8px', fontSize:'13px', fontFamily:'inherit', outline:'none', cursor:'pointer', width:'100%' },
  inp: { background:'#111827', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', color:'#fff', padding:'6px 10px', fontSize:'13px', fontFamily:'inherit', outline:'none', boxSizing:'border-box', width:'100%' },
};
const focusStyle  = { borderColor:'rgba(99,102,241,0.7)' };
const blurStyle   = { borderColor:'rgba(255,255,255,0.12)' };
const fi = e => Object.assign(e.target.style, focusStyle);
const fo = e => Object.assign(e.target.style, blurStyle);

// status colour
const statusColor = s =>
  s==='approved'  ? '#4ade80'
  : s==='rejected'? '#f87171'
  : '#fbbf24';

// ── Inline Edit Row ───────────────────────────────────────────────────────────
const EditRow = ({ exp, onSave, onCancel, isSaving }) => {
  const [cat,  setCat]  = useState(exp.category);
  const [file, setFile] = useState(null);
  const amtRef  = useRef();
  const descRef = useRef();

  const save = async (e) => {
    e.preventDefault();
    const amt = amtRef.current?.value;
    if (!amt || Number(amt) <= 0) { amtRef.current?.focus(); return; }
    onSave({ category: cat, amount: amt, description: descRef.current?.value || '', file });
  };

  return (
    <form onSubmit={save}
      style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'10px', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'8px' }}>

      <p style={{ color:'#818cf8', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>Editing expense</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div>
          <p style={{ color:'#6b7280', fontSize:'11px', margin:'0 0 4px' }}>Category</p>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={IS.sel}>
            {CATS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div>
          <p style={{ color:'#6b7280', fontSize:'11px', margin:'0 0 4px' }}>Amount (₹)</p>
          <input ref={amtRef} type="number" min="1" defaultValue={exp.amount} required style={IS.inp} onFocus={fi} onBlur={fo}/>
        </div>
      </div>

      <div>
        <p style={{ color:'#6b7280', fontSize:'11px', margin:'0 0 4px' }}>Description</p>
        <input ref={descRef} defaultValue={exp.description} placeholder="optional" style={IS.inp} onFocus={fi} onBlur={fo}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <label style={{ display:'flex', alignItems:'center', gap:'6px', flex:1, background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'6px 10px', cursor:'pointer', overflow:'hidden' }}>
          <Upload size={12} color={file?'#818cf8':'#4b5563'}/>
          <span style={{ color:file?'#c7d2fe':'#4b5563', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {file ? file.name : exp.billProof ? 'Replace receipt' : 'Attach receipt'}
          </span>
          <input type="file" style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files[0])}/>
        </label>
        <button type="submit" disabled={isSaving}
          style={{ flexShrink:0, padding:'6px 14px', borderRadius:'8px', border:'none', background:isSaving?'#312e81':'#4f46e5', color:'#fff', fontSize:'12px', fontWeight:600, cursor:isSaving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
          {isSaving ? <><Loader size={12} style={{ animation:'spin 0.8s linear infinite' }}/> Saving...</> : <><Check size={12}/> Save</>}
        </button>
        <button type="button" onClick={onCancel}
          style={{ flexShrink:0, padding:'6px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#6b7280', fontSize:'12px', cursor:'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Expense Sheet Modal ───────────────────────────────────────────────────────
const ExpenseSheetModal = ({ travel, existingExpenses, onClose, onDone }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [allItems,  setAllItems]  = useState({});
  const [days,      setDays]      = useState([1]);
  const [saving,    setSaving]    = useState(false);
  const [editingId, setEditingId] = useState(null);   // which row is in edit mode
  const [editSaving,setEditSaving]= useState(false);
  const [category,  setCategory]  = useState('travel');
  const [file,      setFile]      = useState(null);
  const amtRef  = useRef();
  const descRef = useRef();

  // seed existing on open
  useEffect(() => {
    const grouped = {};
    (existingExpenses||[]).forEach(e => {
      const d = e.tripDay || 1;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(e);
    });
    setAllItems(grouped);
    const existDays = Object.keys(grouped).map(Number).sort((a,b)=>a-b);
    if (existDays.length > 0) { setDays(existDays); setActiveDay(existDays[0]); }
    else { setDays([1]); setActiveDay(1); }
  }, []);

  useEffect(() => {
    const fn = e => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const addDay = () => {
    const next = Math.max(...days) + 1;
    setDays(d => [...d, next]);
    setActiveDay(next);
  };

  // ── Add new row ──────────────────────────────────────────────────────────────
  const saveNewRow = async (e) => {
    e.preventDefault();
    const amt = amtRef.current?.value;
    if (!amt || Number(amt) <= 0) { amtRef.current?.focus(); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('category',      category);
      fd.append('amount',        amt);
      fd.append('description',   descRef.current?.value || '');
      fd.append('travelRequest', travel._id);
      fd.append('tripDay',       activeDay);
      if (file) fd.append('billProof', file);
      const { data } = await API.post('/expense', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAllItems(prev => ({ ...prev, [activeDay]: [...(prev[activeDay]||[]), data] }));
      amtRef.current.value = '';
      if (descRef.current) descRef.current.value = '';
      setFile(null); setCategory('travel');
      amtRef.current?.focus();
    } catch (err) { SA.error('Failed', err.response?.data?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  // ── Update existing row ──────────────────────────────────────────────────────
  const saveEdit = async (expId, { category, amount, description, file: newFile }) => {
    setEditSaving(true);
    try {
      const fd = new FormData();
      fd.append('category',    category);
      fd.append('amount',      amount);
      fd.append('description', description);
      if (newFile) fd.append('billProof', newFile);
      const { data } = await API.put(`/expense/${expId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // replace in local state
      setAllItems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(d => {
          updated[d] = updated[d].map(e => e._id === expId ? data : e);
        });
        return updated;
      });
      setEditingId(null);
    } catch (err) { SA.error('Cannot Update', err.response?.data?.message || 'Only pending expenses can be edited.'); }
    finally { setEditSaving(false); }
  };

  // ── Delete row ───────────────────────────────────────────────────────────────
  const deleteRow = async (expId, day) => {
    const r = await SA.confirm('Delete this expense?', 'This cannot be undone.');
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/expense/${expId}`);
      setAllItems(prev => ({
        ...prev,
        [day]: (prev[day]||[]).filter(e => e._id !== expId),
      }));
    } catch (err) { SA.error('Cannot Delete', err.response?.data?.message || 'Only pending expenses can be deleted.'); }
  };

  const currentItems = allItems[activeDay] || [];
  const dayTotal     = currentItems.reduce((s,e) => s+Number(e.amount), 0);
  const grandTotal   = Object.values(allItems).flat().reduce((s,e) => s+Number(e.amount), 0);

  const handleClose = () => { onDone(); onClose(); };

  return (
    <Overlay onClose={handleClose}>
      <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'18px', width:'100%', maxWidth:'620px', margin:'auto', boxShadow:'0 32px 64px rgba(0,0,0,0.6)' }}
        onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding:'18px 24px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
            <div>
              <p style={{ color:'#fff', fontWeight:700, fontSize:'15px', margin:0 }}>Expense Sheet</p>
              <p style={{ color:'#4b5563', fontSize:'12px', margin:'3px 0 0' }}>
                {travel.from} → {travel.destination} · {travel.purpose}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ textAlign:'right' }}>
                <p style={{ color:'#6b7280', fontSize:'11px', margin:0 }}>Grand total</p>
                <p style={{ color:'#a5b4fc', fontWeight:700, fontSize:'16px', margin:0 }}>{fmtMoney(grandTotal)}</p>
              </div>
              <button onClick={handleClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', padding:'4px' }}><X size={18}/></button>
            </div>
          </div>

          {/* Day tabs */}
          <div style={{ display:'flex', gap:'2px', overflowX:'auto', paddingBottom:'1px' }}>
            {days.map(d => {
              const tot    = (allItems[d]||[]).reduce((s,e)=>s+Number(e.amount),0);
              const active = d === activeDay;
              return (
                <button key={d} onClick={()=>{ setActiveDay(d); setEditingId(null); }}
                  style={{ flexShrink:0, padding:'8px 14px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:active?600:400,
                    background: active?'#1a1f2e':'transparent',
                    color: active?'#a5b4fc':'#4b5563',
                    borderBottom: active?'2px solid #6366f1':'2px solid transparent',
                    transition:'all 0.15s' }}>
                  Day {d}
                  {tot > 0 && <span style={{ marginLeft:'6px', fontSize:'11px', color:active?'#818cf8':'#374151' }}>{fmtMoney(tot)}</span>}
                </button>
              );
            })}
            <button onClick={addDay}
              style={{ flexShrink:0, padding:'8px 12px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', fontSize:'12px', color:'#374151', background:'transparent', display:'flex', alignItems:'center', gap:'4px' }}
              onMouseEnter={e=>e.currentTarget.style.color='#9ca3af'}
              onMouseLeave={e=>e.currentTarget.style.color='#374151'}>
              <Plus size={13}/> Day
            </button>
          </div>
        </div>

        {/* ── Day content ── */}
        <div style={{ padding:'16px 24px', background:'#1a1f2e', minHeight:'180px' }}>

          {/* Saved rows */}
          {currentItems.length === 0 ? (
            <p style={{ textAlign:'center', padding:'24px 0', color:'#374151', fontSize:'13px' }}>
              No expenses for Day {activeDay} yet
            </p>
          ) : (
            <div style={{ marginBottom:'12px' }}>
              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:'24px 108px 1fr 90px 56px', gap:'8px', padding:'0 0 6px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'4px' }}>
                {['#','Category','Description','Amount',''].map(h => (
                  <span key={h} style={{ color:'#374151', fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</span>
                ))}
              </div>

              {currentItems.map((exp, i) => (
                <div key={exp._id || i}>
                  {/* ── Edit mode ── */}
                  {editingId === exp._id ? (
                    <div style={{ marginBottom:'6px' }}>
                      <EditRow
                        exp={exp}
                        isSaving={editSaving}
                        onSave={(payload) => saveEdit(exp._id, payload)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    /* ── Read mode ── */
                    <div style={{ display:'grid', gridTemplateColumns:'24px 108px 1fr 90px 56px', gap:'8px', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      {/* # */}
                      <span style={{ color:'#4b5563', fontSize:'12px', textAlign:'center' }}>{i+1}</span>
                      {/* Category */}
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <span style={{ fontSize:'15px' }}>{CAT_ICON[exp.category]}</span>
                        <span style={{ color:'#d1d5db', fontSize:'13px', textTransform:'capitalize' }}>{exp.category}</span>
                      </div>
                      {/* Description */}
                      <div style={{ minWidth:0 }}>
                        <span style={{ color:'#9ca3af', fontSize:'13px', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {exp.description || <span style={{ color:'#374151' }}>—</span>}
                        </span>
                        {exp.billProof && (
                          <a href={`http://localhost:5000/uploads/bills/${exp.billProof}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color:'#6366f1', fontSize:'11px' }}>📎 receipt</a>
                        )}
                      </div>
                      {/* Amount + status */}
                      <div style={{ textAlign:'right' }}>
                        <span style={{ color:'#e5e7eb', fontSize:'13px', fontWeight:600 }}>{fmtMoney(exp.amount)}</span>
                        <div>
                          <span style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', color: statusColor(exp.status) }}>
                            {exp.status}
                          </span>
                        </div>
                      </div>
                      {/* Edit / Delete — only shown for pending */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'4px' }}>
                        {exp.status === 'pending' ? (
                          <>
                            <button onClick={() => setEditingId(exp._id)} title="Edit"
                              style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'6px', color:'#818cf8', cursor:'pointer', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.25)'}
                              onMouseLeave={e=>e.currentTarget.style.background='rgba(99,102,241,0.1)'}>
                              <Pencil size={12}/>
                            </button>
                            <button onClick={() => deleteRow(exp._id, activeDay)} title="Delete"
                              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'6px', color:'#f87171', cursor:'pointer', width:'26px', height:'26px', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.25)'}
                              onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
                              <Trash2 size={12}/>
                            </button>
                          </>
                        ) : (
                          <span style={{ color:'#374151', fontSize:'11px' }}>locked</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Day subtotal */}
              <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'8px', paddingTop:'10px' }}>
                <span style={{ color:'#4b5563', fontSize:'12px' }}>Day {activeDay} total</span>
                <span style={{ color:'#a5b4fc', fontWeight:700, fontSize:'15px' }}>{fmtMoney(dayTotal)}</span>
              </div>
            </div>
          )}

          {/* ── Add new row form ── */}
          <form onSubmit={saveNewRow}
            style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <p style={{ color:'#6b7280', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>
              + Add expense · Day {activeDay}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div>
                <p style={{ color:'#6b7280', fontSize:'11px', marginBottom:'5px' }}>Category</p>
                <select value={category} onChange={e=>setCategory(e.target.value)} style={IS.sel}>
                  {CATS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
              </div>
              <div>
                <p style={{ color:'#6b7280', fontSize:'11px', marginBottom:'5px' }}>Amount (₹) *</p>
                <input ref={amtRef} type="number" min="1" placeholder="e.g. 450" required style={IS.inp}
                  onFocus={fi} onBlur={fo}/>
              </div>
            </div>
            <div>
              <p style={{ color:'#6b7280', fontSize:'11px', marginBottom:'5px' }}>Description (optional)</p>
              <input ref={descRef} placeholder="e.g. Ola cab airport to hotel" style={IS.inp} onFocus={fi} onBlur={fo}/>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'6px', background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'7px 12px', cursor:'pointer', flex:1, overflow:'hidden' }}>
                <Upload size={13} color={file?'#818cf8':'#4b5563'}/>
                <span style={{ color:file?'#c7d2fe':'#4b5563', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {file ? file.name : 'Attach receipt (optional)'}
                </span>
                <input type="file" style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setFile(e.target.files[0])}/>
              </label>
              <button type="submit" disabled={saving}
                style={{ flexShrink:0, padding:'7px 18px', borderRadius:'8px', border:'none', background:saving?'#312e81':'#4f46e5', color:'#fff', fontWeight:600, fontSize:'13px', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
                {saving ? <><Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Saving...</> : <><Plus size={13}/> Add</>}
              </button>
            </div>
          </form>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <span style={{ color:'#4b5563', fontSize:'12px' }}>Grand total · </span>
            <span style={{ color:'#a5b4fc', fontWeight:700, fontSize:'15px' }}>{fmtMoney(grandTotal)}</span>
            <span style={{ color:'#374151', fontSize:'12px' }}> across {days.length} day{days.length>1?'s':''}</span>
          </div>
          <button onClick={handleClose}
            style={{ padding:'8px 20px', borderRadius:'8px', border:'none', background:'#059669', color:'#fff', fontWeight:600, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
            <CheckCircle2 size={14}/> Done
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </Overlay>
  );
};

// ── Day accordion (read-only on detail page) ──────────────────────────────────
const DayGroup = ({ day, items }) => {
  const [open, setOpen] = useState(true);
  const total = items.reduce((s,e)=>s+e.amount, 0);
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-2">
      <button onClick={()=>setOpen(p=>!p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition text-left">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-400 text-xs font-bold">{day}</span>
          </div>
          <p className="text-white text-sm font-semibold">Day {day}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-indigo-400 font-semibold text-sm">{fmtMoney(total)}</span>
          <span className="text-gray-600 text-xs">{items.length} item{items.length!==1?'s':''}</span>
          {open ? <ChevronUp size={15} className="text-gray-600"/> : <ChevronDown size={15} className="text-gray-600"/>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 space-y-1.5">
          {items.map((exp,i) => (
            <div key={exp._id} className="flex items-center gap-3 bg-gray-900/50 rounded-xl px-3 py-2.5">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-semibold flex-shrink-0">{i+1}</span>
              <span className="text-base">{CAT_ICON[exp.category]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium capitalize">{exp.category}</p>
                {exp.description && <p className="text-gray-500 text-xs truncate">{exp.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {exp.billProof && (
                  <a href={`http://localhost:5000/uploads/bills/${exp.billProof}`} target="_blank" rel="noopener noreferrer"
                    className="text-indigo-400 text-xs hover:underline">📎</a>
                )}
                <span className="text-white font-semibold text-sm">{fmtMoney(exp.amount)}</span>
                <StatusBadge status={exp.status}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main TravelDetail page ────────────────────────────────────────────────────
export default function TravelDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [travel,   setTravel]   = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showExp,  setShowExp]  = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [tRes, eRes] = await Promise.all([API.get(`/travel/${id}`), API.get(`/expense/${id}`)]);
      setTravel(tRes.data); setExpenses(eRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const reloadExpenses = useCallback(async () => {
    try { const { data } = await API.get(`/expense/${id}`); setExpenses(data); } catch (_) {}
  }, [id]);

  const downloadPDF = async () => {
    try {
      const res = await API.get(`/report/${id}/pdf`, { responseType:'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
      Object.assign(document.createElement('a'), { href:url, download:`expense-${travel.destination}-${id.slice(-5)}.pdf` }).click();
      URL.revokeObjectURL(url);
    } catch { SA.error('Failed', 'Could not generate PDF.'); }
  };

  const completeTrip = async () => {
    const r = await SA.confirm('Complete This Trip?', 'All uploaded files will be permanently deleted.');
    if (!r.isConfirmed) return;
    try { await API.put(`/travel/${id}/complete`); SA.success('Trip Completed! 🎉',''); navigate('/employee/travels',{replace:true}); }
    catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const cancelTravel = async () => {
    const r = await SA.confirm('Cancel Request?', 'This cannot be undone.');
    if (!r.isConfirmed) return;
    try { await API.put(`/travel/${id}/cancel`); SA.success('Cancelled',''); navigate('/employee/travels',{replace:true}); }
    catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  if (loading) return <LoadingScreen/>;
  if (!travel)  return <div className="p-6 bg-gray-950 min-h-screen flex items-center justify-center"><p className="text-gray-500">Travel not found.</p></div>;

  const t           = travel;
  const totalExp    = (expenses||[]).reduce((s,e)=>s+e.amount,0);
  const approvedExp = (expenses||[]).filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);
  const byDay       = {};
  (expenses||[]).forEach(e => { const d=e.tripDay||1; if(!byDay[d]) byDay[d]=[]; byDay[d].push(e); });
  const dayKeys     = Object.keys(byDay).map(Number).sort((a,b)=>a-b);

  const bookingLabel =
    t.bookingType==='self'                          ? '🙋 Self — you arranged own tickets'
    : t.status==='approved'                         ? '🏢 HR — waiting for HR to book'
    : (t.status==='booked'||t.status==='completed') ? '🏢 HR — tickets booked ✅'
    : '🏢 HR — will book after manager approval';

  return (
    <div className="p-6 bg-gray-950 min-h-screen space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={()=>navigate(-1)} className="mt-1 p-2 rounded-xl bg-gray-900 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition flex-shrink-0">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-2xl font-bold truncate">{t.from} → {t.destination}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t.purpose}</p>
        </div>
        <StatusBadge status={t.status}/>
      </div>

      {/* Trip info */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">Trip Details</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoCell Icon={MapPin}   label="From"        value={t.from}/>
          <InfoCell Icon={MapPin}   label="Destination" value={t.destination}/>
          <InfoCell Icon={Calendar} label="Departure"   value={fmtDate(t.fromDate)}/>
          <InfoCell Icon={Calendar} label="Return"      value={fmtDate(t.toDate)}/>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-gray-500 text-xs">🎫 <span className="text-gray-300">{bookingLabel}</span></p>
          {t.ticketFile && (
            <a href={`http://localhost:5000/uploads/tickets/${t.ticketFile}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition">
              📎 View Ticket
            </a>
          )}
        </div>
        {t.managerNote && (
          <div className="mt-4 flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-yellow-400 text-xs font-medium">Manager Note</p>
              <p className="text-gray-300 text-sm mt-0.5">{t.managerNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expenses */}
      {expenses !== null && (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Expenses</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-500 text-xs">Submitted: <span className="text-white font-semibold">{fmtMoney(totalExp)}</span></span>
                <span className="text-gray-500 text-xs">Approved: <span className="text-green-400 font-semibold">{fmtMoney(approvedExp)}</span></span>
              </div>
            </div>
            {t.status==='booked' && (
              <button onClick={()=>setShowExp(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-medium transition">
                <ClipboardList size={13}/> Open Expense Sheet
              </button>
            )}
          </div>

          {expenses.length===0
            ? <div className="text-center py-10">
                <p className="text-gray-600 text-sm">No expenses added yet.</p>
                {t.status==='booked' && (
                  <button onClick={()=>setShowExp(true)} className="mt-3 text-indigo-400 text-xs hover:underline">
                    + Open expense sheet
                  </button>
                )}
              </div>
            : <>
                {dayKeys.map(d=><DayGroup key={d} day={d} items={byDay[d]}/>)}
                <div className="flex items-center justify-between bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-4 py-3 mt-2">
                  <span className="text-indigo-300 text-sm font-semibold">Grand Total</span>
                  <span className="text-indigo-300 font-bold text-base">{fmtMoney(totalExp)}</span>
                </div>
              </>
          }
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {(t.status==='booked'||t.status==='completed') && (
          <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-medium transition">
            <Download size={15}/> Download PDF
          </button>
        )}
        {t.status==='booked' && (
          <button onClick={completeTrip} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-medium transition">
            <CheckCircle2 size={15}/> Complete Trip
          </button>
        )}
        {t.status==='pending' && (
          <button onClick={cancelTravel} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition">
            <X size={15}/> Cancel Request
          </button>
        )}
      </div>

      {showExp && expenses!==null && (
        <ExpenseSheetModal
          travel={t}
          existingExpenses={expenses}
          onClose={()=>setShowExp(false)}
          onDone={reloadExpenses}
        />
      )}
    </div>
  );
}
