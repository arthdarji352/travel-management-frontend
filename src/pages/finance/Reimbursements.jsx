import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import API from '../../api/axios';
import Swal from 'sweetalert2';

const MODES = [
  { value: 'cash',          label: '💵 Cash'         },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'upi',           label: '📱 UPI'           },
];

// ── Modal — top-level component, createPortal, uncontrolled refs ─────────────
const ReimburseModal = ({ item, onClose, onDone }) => {
  const modeRef = useRef();
  const refRef  = useRef();
  const noteRef = useRef();
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

  const { travel, totalApproved, advancePaid, balanceDue, expenses } = item;

  const submit = async () => {
    if (done || saving) return;
    const paymentMode     = modeRef.current.value;
    const referenceNumber = refRef.current.value.trim();
    const note            = noteRef.current.value.trim();

    if (!paymentMode) {
      setError('Please select a payment mode.');
      return;
    }
    setError('');

    setSaving(true);
    setDone(true);
    try {
      await API.put(`/finance/reimburse/${travel._id}`, { paymentMode, referenceNumber, note });
      onDone(); // close + reload
      Swal.fire({
        icon: 'success', title: 'Reimbursed! 💳',
        text: `₹${Math.abs(balanceDue).toLocaleString()} reimbursement processed. Employee & Manager notified.`,
        background: '#0d1117', color: '#fff', confirmButtonColor: '#ea580c',
      });
    } catch (err) {
      setDone(false);
      setSaving(false);
      Swal.fire({ icon:'error', title:'Failed', text: err.response?.data?.message || 'Something went wrong', background:'#0d1117', color:'#fff' });
    }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#111827', border:'1px solid rgba(249,115,22,0.3)', borderRadius:'16px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid #1f2937', position:'sticky', top:0, background:'#111827', zIndex:1 }}>
          <h2 style={{ color:'#fff', fontSize:'17px', fontWeight:700, margin:0 }}>💳 Process Reimbursement</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'4px' }}><X size={20}/></button>
        </div>

        <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Employee info */}
          <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:'12px', padding:'14px' }}>
            <p style={{ color:'#fff', fontWeight:600, margin:'0 0 2px' }}>{travel.employee?.name}</p>
            <p style={{ color:'#9ca3af', fontSize:'13px', margin:'0 0 6px' }}>{travel.employee?.email}</p>
            <p style={{ color:'#fb923c', fontSize:'13px', margin:0 }}>✈️ {travel.destination} — {travel.purpose}</p>
          </div>

          {/* Amount breakdown */}
          <div style={{ background:'#1f2937', borderRadius:'10px', padding:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#9ca3af', fontSize:'13px' }}>Total Approved Expenses</span>
              <span style={{ color:'#fff', fontWeight:600 }}>₹{totalApproved.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#9ca3af', fontSize:'13px' }}>Advance Already Paid</span>
              <span style={{ color:'#facc15', fontWeight:600 }}>− ₹{advancePaid.toLocaleString()}</span>
            </div>
            <div style={{ borderTop:'1px solid #374151', paddingTop:'10px', display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontSize:'14px', fontWeight:700 }}>
                {balanceDue < 0 ? 'Refund from Employee' : 'Balance to Reimburse'}
              </span>
              <span style={{ color: balanceDue < 0 ? '#34d399' : '#f97316', fontWeight:700, fontSize:'16px' }}>
                ₹{Math.abs(balanceDue).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Expense list */}
          <div>
            <p style={{ color:'#6b7280', fontSize:'11px', fontWeight:600, letterSpacing:'0.05em', marginBottom:'8px' }}>APPROVED EXPENSES ({expenses.length})</p>
            {expenses.map((e, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #1f2937' }}>
                <span style={{ color:'#9ca3af', fontSize:'13px', textTransform:'capitalize' }}>{e.category}{e.description ? ` — ${e.description}` : ''}</span>
                <span style={{ color:'#fff', fontSize:'13px', fontWeight:500 }}>₹{e.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Inline error */}
          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#f87171', padding:'10px 14px', fontSize:'13px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label style={{ color:'#9ca3af', fontSize:'11px', fontWeight:600, display:'block', marginBottom:'6px', letterSpacing:'0.05em' }}>PAYMENT MODE *</label>
            <select ref={modeRef} style={{ width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box' }}>
              <option value="">Select mode...</option>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label style={{ color:'#9ca3af', fontSize:'11px', fontWeight:600, display:'block', marginBottom:'6px', letterSpacing:'0.05em' }}>REFERENCE NUMBER (optional)</label>
            <input ref={refRef} placeholder="UTR / Transaction ID" style={{ width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box', outline:'none' }} />
          </div>

          {/* Note */}
          <div>
            <label style={{ color:'#9ca3af', fontSize:'11px', fontWeight:600, display:'block', marginBottom:'6px', letterSpacing:'0.05em' }}>NOTE (optional)</label>
            <textarea ref={noteRef} rows={2} style={{ width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', resize:'none', boxSizing:'border-box', outline:'none' }} />
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', background:'#1f2937', border:'1px solid #374151', borderRadius:'10px', color:'#9ca3af', cursor:'pointer', fontSize:'14px' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving || done} style={{ flex:1, padding:'11px', background:'#ea580c', border:'none', borderRadius:'10px', color:'#fff', fontWeight:700, cursor:(saving||done)?'not-allowed':'pointer', fontSize:'14px', opacity:(saving||done)?0.6:1 }}>
              {saving ? 'Processing...' : '✅ Process Reimbursement'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Reimbursements() {
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});

  const load = () => {
    setLoading(true);
    API.get('/finance/reimbursements')
       .then(r => { setList(r.data); setLoading(false); })
       .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDone = () => { setSelected(null); load(); };
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="p-6 space-y-6">

      {selected && (
        <ReimburseModal item={selected} onClose={() => setSelected(null)} onDone={handleDone} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Expense Reimbursements</h1>
        <p className="text-gray-400 text-sm mt-1">Approved expenses waiting to be reimbursed to employees</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-gray-400 text-sm">No pending reimbursements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(item => {
            const open = expanded[item.travel._id];
            return (
              <div key={item.travel._id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                        {item.travel.employee?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{item.travel.employee?.name}</p>
                        <p className="text-gray-500 text-xs">{item.travel.employee?.email}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">✈️ {item.travel.destination} — {item.travel.purpose}</p>
                    <div className="flex gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500">Approved: <span className="text-white font-semibold">₹{item.totalApproved.toLocaleString()}</span></span>
                      <span className="text-xs text-gray-500">Advance Paid: <span className="text-yellow-400 font-semibold">₹{item.advancePaid.toLocaleString()}</span></span>
                      <span className="text-xs text-gray-500">Balance Due: <span className="text-orange-400 font-bold">₹{item.balanceDue.toLocaleString()}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggle(item.travel._id)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition">
                      {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                    <button onClick={() => setSelected(item)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition text-sm">
                      <CreditCard size={14}/> Reimburse
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="border-t border-gray-800 px-5 pb-4">
                    <p className="text-gray-500 text-xs font-semibold mt-3 mb-2">APPROVED EXPENSES</p>
                    {item.expenses.map((e, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
                        <span className="text-gray-400 text-sm capitalize">{e.category}{e.description ? ` — ${e.description}` : ''}</span>
                        <span className="text-white text-sm font-medium">₹{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
