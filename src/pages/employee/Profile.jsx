import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Loader, Eye, EyeOff, ShieldCheck, Plane, BarChart2, DollarSign, CheckCircle } from 'lucide-react';
import API from '../../api/axios.js';
import { Card, CardTitle, fmtMoney, SA } from '../../components/employee/shared.jsx';

const ACCENT = 'bg-indigo-600';

const PassField = ({ label, refProp, show, onToggle, placeholder, autoComplete }) => (
  <div>
    <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <input ref={refProp} type={show?'text':'password'} placeholder={placeholder}
        autoComplete={autoComplete} required
        className="w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition placeholder-gray-600"/>
      <button type="button" tabIndex={-1} onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
        {show ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
  </div>
);

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [saving,  setSaving]  = useState(false);
  const [show,    setShow]    = useState({ cur:false, nw:false, con:false });
  const [stats,   setStats]   = useState(null);
  const curRef=useRef(), newRef=useRef(), conRef=useRef();

  const toggle = key => setShow(s => ({ ...s, [key]:!s[key] }));

  // load personal stats
  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, advRes] = await Promise.all([API.get('/travel'), API.get('/advance')]);
        const travels = tRes.data;
        const expAll  = await Promise.all(
          travels.map(t => API.get(`/expense/${t._id}`).then(r=>r.data).catch(()=>[]))
        );
        const expenses = expAll.flat();
        setStats({
          totalTrips:      travels.length,
          completedTrips:  travels.filter(t=>t.status==='completed').length,
          totalClaimed:    expenses.reduce((s,e)=>s+e.amount, 0),
          totalApproved:   expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0),
          totalAdvances:   advRes.data.length,
        });
      } catch(_) {}
    };
    load();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const cur = curRef.current.value, nw = newRef.current.value, con = conRef.current.value;
    if (nw !== con)    return SA.error('Mismatch!','New password and confirm must match.');
    if (nw.length < 6) return SA.error('Too Short!','Password must be at least 6 characters.');
    setSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword:cur, newPassword:nw });
      curRef.current.value=''; newRef.current.value=''; conRef.current.value='';
      SA.success('Password Updated!','Your password has been changed.');
    } catch (err) {
      SA.error('Failed!', err.response?.data?.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <div className="max-w-lg space-y-6">

        <div>
          <h1 className="text-white text-2xl font-bold">Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your account & travel summary</p>
        </div>

        {/* User info card */}
        <Card>
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${ACCENT} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-lg font-bold truncate">{user?.name}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs rounded-full capitalize border border-indigo-500/20">{user?.role}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-700 text-xs mt-4 pt-4 border-t border-white/5">
            To update your name or email, contact the Admin.
          </p>
        </Card>

        {/* Personal stats */}
        {stats && (
          <Card>
            <CardTitle>My Travel Stats</CardTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Total Trips',      value: stats.totalTrips,                    icon: Plane,       color:'text-indigo-400' },
                { label:'Completed Trips',  value: stats.completedTrips,                icon: CheckCircle, color:'text-green-400'  },
                { label:'Total Claimed',    value: fmtMoney(stats.totalClaimed),        icon: DollarSign,  color:'text-blue-400'   },
                { label:'Total Approved',   value: fmtMoney(stats.totalApproved),       icon: BarChart2,  color:'text-teal-400'   },
              ].map(s => (
                <div key={s.label} className="bg-gray-900/60 rounded-xl p-4 flex items-center gap-3">
                  <s.icon size={18} className={`${s.color} flex-shrink-0`}/>
                  <div>
                    <p className="text-gray-500 text-xs">{s.label}</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Change password */}
        <Card>
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400"/> Change Password
          </h2>
          <p className="text-gray-600 text-xs mb-5">Choose a strong password you haven't used before.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PassField label="Current Password"    refProp={curRef} show={show.cur} onToggle={()=>toggle('cur')} placeholder="Your current password"  autoComplete="current-password"/>
            <PassField label="New Password"         refProp={newRef} show={show.nw}  onToggle={()=>toggle('nw')}  placeholder="At least 6 characters"  autoComplete="new-password"/>
            <PassField label="Confirm New Password" refProp={conRef} show={show.con} onToggle={()=>toggle('con')} placeholder="Repeat new password"     autoComplete="new-password"/>
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition mt-2">
              {saving ? <><Loader size={15} className="animate-spin"/> Updating...</> : <><Lock size={15}/> Update Password</>}
            </button>
          </form>
        </Card>

        {/* Footer */}
        <div className="pt-2 text-center">
          <p className="text-gray-700 text-xs">Made with ❤️ by <span className="text-gray-500 font-medium">Arth</span> © 2026</p>
        </div>

      </div>
    </div>
  );
}
