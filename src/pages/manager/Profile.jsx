import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Loader, Eye, EyeOff, ShieldCheck, Users, CheckCircle, Clock, DollarSign, Plane, BarChart2 } from 'lucide-react';
import API from '../../api/axios.js';
import { Card, CardTitle, fmtMoney, SA } from '../../components/employee/shared.jsx';

export default function ManagerProfile() {
  const { user }  = useAuth();
  const [saving,  setSaving]  = useState(false);
  const [show,    setShow]    = useState({ cur:false, nw:false, con:false });
  const [stats,   setStats]   = useState(null);
  const curRef=useRef(), newRef=useRef(), conRef=useRef();
  const toggle = key => setShow(s => ({ ...s, [key]:!s[key] }));

  useEffect(() => {
    const load = async () => {
      try {
        // Team stats
        const [tr, adv, exp] = await Promise.all([
          API.get('/travel'), API.get('/advance'), API.get('/expense'),
        ]);
        // Own travel stats (manager as traveller)
        const ownTravels = await API.get('/travel?own=true');
        const ownExpAll  = await Promise.all(
          ownTravels.data.map(t => API.get(`/expense/${t._id}`).then(r=>r.data).catch(()=>[]))
        );
        const ownExpenses = ownExpAll.flat();

        setStats({
          // team stats
          teamTravels:     tr.data.length,
          pendingApprovals: tr.data.filter(t=>t.status==='pending').length,
          teamApproved:    tr.data.filter(t=>['approved','booked','completed'].includes(t.status)).length,
          teamExpTotal:    exp.data.reduce((s,e)=>s+e.amount, 0),
          // own stats
          ownTrips:        ownTravels.data.length,
          ownCompleted:    ownTravels.data.filter(t=>t.status==='completed').length,
          ownClaimed:      ownExpenses.reduce((s,e)=>s+e.amount, 0),
          ownApproved:     ownExpenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount, 0),
        });
      } catch (_) {}
    };
    load();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    const cur=curRef.current.value, nw=newRef.current.value, con=conRef.current.value;
    if (nw!==con)      return SA.error('Mismatch!','Passwords must match.');
    if (nw.length < 6) return SA.error('Too Short!','Min 6 characters required.');
    setSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword:cur, newPassword:nw });
      curRef.current.value=''; newRef.current.value=''; conRef.current.value='';
      SA.success('Password Updated!','');
    } catch(err) { SA.error('Failed!', err.response?.data?.message||'Something went wrong.'); }
    finally { setSaving(false); }
  };

  const ic = "w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition placeholder-gray-600";

  const PassField = ({ label, refProp, showKey, placeholder, autoComplete }) => (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input ref={refProp} type={show[showKey]?'text':'password'} placeholder={placeholder} autoComplete={autoComplete} required className={ic}/>
        <button type="button" tabIndex={-1} onClick={()=>toggle(showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
          {show[showKey]?<EyeOff size={15}/>:<Eye size={15}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <div className="max-w-lg space-y-6">

        <div>
          <h1 className="text-white text-2xl font-bold">Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your account, team & personal travel summary</p>
        </div>

        {/* User info */}
        <Card>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-lg font-bold">{user?.name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <span className="mt-2 inline-block px-2.5 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full capitalize border border-purple-500/20">{user?.role}</span>
            </div>
          </div>
        </Card>

        {stats && (
          <>
            {/* Team overview */}
            <Card>
              <CardTitle>Team Overview</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'Team Travels',     value: stats.teamTravels,                  icon:Users,       color:'text-purple-400' },
                  { label:'Approved',         value: stats.teamApproved,                 icon:CheckCircle, color:'text-green-400'  },
                  { label:'Pending Approval', value: stats.pendingApprovals,             icon:Clock,       color:'text-yellow-400' },
                  { label:'Team Expenses',    value: fmtMoney(stats.teamExpTotal),       icon:DollarSign,  color:'text-teal-400'   },
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

            {/* Own travel stats */}
            <Card>
              <CardTitle>My Travel Stats</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:'My Total Trips',    value: stats.ownTrips,                  icon:Plane,    color:'text-purple-400' },
                  { label:'Completed Trips',   value: stats.ownCompleted,              icon:CheckCircle, color:'text-green-400' },
                  { label:'Total Claimed',     value: fmtMoney(stats.ownClaimed),      icon:DollarSign,  color:'text-blue-400'  },
                  { label:'Total Approved',    value: fmtMoney(stats.ownApproved),     icon:BarChart2,   color:'text-teal-400'  },
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
          </>
        )}

        {/* Change password */}
        <Card>
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-400"/> Change Password
          </h2>
          <p className="text-gray-600 text-xs mb-5">Choose a strong password.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PassField label="Current Password"     refProp={curRef} showKey="cur" placeholder="Current password"  autoComplete="current-password"/>
            <PassField label="New Password"          refProp={newRef} showKey="nw"  placeholder="Min 6 characters" autoComplete="new-password"/>
            <PassField label="Confirm New Password"  refProp={conRef} showKey="con" placeholder="Repeat password"  autoComplete="new-password"/>
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition mt-2">
              {saving?<><Loader size={15} className="animate-spin"/> Updating...</>:<><Lock size={15}/> Update Password</>}
            </button>
          </form>
        </Card>

        <div className="pt-2 text-center">
          <p className="text-gray-700 text-xs">Made with ❤️ by <span className="text-gray-500 font-medium">Arth</span> © 2026</p>
        </div>
      </div>
    </div>
  );
}
