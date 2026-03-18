import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, X, CheckCircle } from 'lucide-react';
import API from '../../api/axios';
import Swal from 'sweetalert2';

const MODES = [
  { value: 'cash',          label: '💵 Cash'          },
  { value: 'bank_transfer', label: '🏦 Bank Transfer'  },
  { value: 'upi',           label: '📱 UPI'            },
];

// ── Modal — defined OUTSIDE parent, createPortal, uncontrolled refs ──────────
const DisburseModal = ({ adv, onClose, onDone }) => {
  const modeRef = useRef();
  const refRef  = useRef();
  const noteRef = useRef();
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

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
      await API.put(`/finance/disburse/${adv._id}`, { paymentMode, referenceNumber, note });
      onDone(); // close + reload list
      Swal.fire({
        icon: 'success', title: 'Disbursed! 💰',
        text: `₹${adv.amount.toLocaleString()} marked as disbursed. Employee & Manager notified.`,
        background: '#0d1117', color: '#fff', confirmButtonColor: '#ca8a04',
      });
    } catch (err) {
      setDone(false);
      setSaving(false);
      Swal.fire({ icon:'error', title:'Failed', text: err.response?.data?.message || 'Something went wrong', background:'#0d1117', color:'#fff' });
    }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#111827', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'16px', width:'100%', maxWidth:'460px', padding:'0' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid #1f2937' }}>
          <h2 style={{ color:'#fff', fontSize:'17px', fontWeight:700, margin:0 }}>💰 Disburse Advance</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'4px' }}><X size={20}/></button>
        </div>

        <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Employee & travel info */}
          <div style={{ background:'rgba(234,179,8,0.06)', border:'1px solid rgba(234,179,8,0.2)', borderRadius:'12px', padding:'14px' }}>
            <p style={{ color:'#fff', fontWeight:600, margin:'0 0 2px' }}>{adv.employee?.name}</p>
            <p style={{ color:'#9ca3af', fontSize:'13px', margin:'0 0 8px' }}>{adv.employee?.email}</p>
            <p style={{ color:'#fbbf24', fontSize:'15px', fontWeight:700, margin:'0 0 2px' }}>₹{adv.amount.toLocaleString()}</p>
            <p style={{ color:'#6b7280', fontSize:'12px', margin:0 }}>✈️ {adv.travelRequest?.from} → {adv.travelRequest?.destination}</p>
            <p style={{ color:'#6b7280', fontSize:'12px', margin:'4px 0 0' }}>{adv.reason}</p>
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
            <input ref={refRef} placeholder="UTR / Transaction ID / Cheque no." style={{ width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box', outline:'none' }} />
          </div>

          {/* Note */}
          <div>
            <label style={{ color:'#9ca3af', fontSize:'11px', fontWeight:600, display:'block', marginBottom:'6px', letterSpacing:'0.05em' }}>NOTE (optional)</label>
            <textarea ref={noteRef} rows={2} placeholder="Any remarks..." style={{ width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', resize:'none', boxSizing:'border-box', outline:'none' }} />
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', background:'#1f2937', border:'1px solid #374151', borderRadius:'10px', color:'#9ca3af', cursor:'pointer', fontSize:'14px' }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving || done} style={{ flex:1, padding:'11px', background:'#ca8a04', border:'none', borderRadius:'10px', color:'#fff', fontWeight:700, cursor: (saving || done) ? 'not-allowed' : 'pointer', fontSize:'14px', opacity: (saving || done) ? 0.6 : 1 }}>
              {saving ? 'Processing...' : '✅ Mark Disbursed'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Disbursements() {
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    API.get('/finance/disbursements')
       .then(r => { setList(r.data); setLoading(false); })
       .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDone = () => {
    setSelected(null);
    load();
  };

  return (
    <div className="p-6 space-y-6">

      {/* Modal rendered via portal */}
      {selected && (
        <DisburseModal
          adv={selected}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Advance Disbursements</h1>
        <p className="text-gray-400 text-sm mt-1">Manager-approved advances waiting to be paid</p>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All caught up!</p>
          <p className="text-gray-400 text-sm">No pending advance disbursements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(adv => (
            <div key={adv._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">
                    {adv.employee?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{adv.employee?.name}</p>
                    <p className="text-gray-500 text-xs">{adv.employee?.email}</p>
                  </div>
                </div>
                <p className="text-yellow-400 font-bold text-xl">₹{adv.amount.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mt-0.5">✈️ {adv.travelRequest?.from} → {adv.travelRequest?.destination}</p>
                <p className="text-gray-500 text-xs mt-0.5">{adv.reason}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {new Date(adv.travelRequest?.fromDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} →{' '}
                  {new Date(adv.travelRequest?.toDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelected(adv)}
                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition text-sm flex-shrink-0"
              >
                <Wallet size={15}/> Disburse
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
