import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Clock, XCircle, BarChart2, DollarSign, ChevronRight, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../../api/axios.js';
import { StatusBadge, StatCard, SerialNo, LoadingScreen, Card, CardTitle, fmtDate, fmtMoney } from '../../components/employee/shared.jsx';
import NotificationBell from '../../components/employee/NotificationBell.jsx';

const PIE_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6'];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [travels,   setTravels]   = useState([]);
  const [expenses,  setExpenses]  = useState([]);
  const [advances,  setAdvances]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, advRes] = await Promise.all([API.get('/travel'), API.get('/advance')]);
      setTravels(tRes.data);
      setAdvances(advRes.data);
      const expAll = await Promise.all(
        tRes.data.map(t => API.get(`/expense/${t._id}`).then(r => r.data).catch(() => []))
      );
      // attach travel context to each expense
      const flat = expAll.flatMap((exps, i) =>
        exps.map(e => ({ ...e, _dest: tRes.data[i]?.destination || '?' }))
      );
      setExpenses(flat);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = {
    completed: travels.filter(t => t.status === 'completed').length,
    pending:   travels.filter(t => t.status === 'pending').length,
    booked:    travels.filter(t => t.status === 'booked').length,
    rejected:  travels.filter(t => t.status === 'rejected').length,
  };

  // this month expenses
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((s,e) => s+e.amount, 0);
  const totalClaimed   = expenses.reduce((s,e) => s+e.amount, 0);
  const totalApproved  = expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);

  // active advance (pending or approved, not disbursed)
  const activeAdv = advances.find(a => ['pending','approved'].includes(a.status));

  // ── pie — category ─────────────────────────────────────────────────────────
  const catMap = { travel:0, taxi:0, hotel:0, food:0, other:0 };
  expenses.forEach(e => { if (e.category in catMap) catMap[e.category] += e.amount; });
  const pieData = Object.entries(catMap)
    .map(([k,v]) => ({ name: k.charAt(0).toUpperCase()+k.slice(1), value:v }))
    .filter(d => d.value > 0);

  // ── bar — trip-wise ────────────────────────────────────────────────────────
  const tripMap = {};
  expenses.forEach(e => {
    if (!tripMap[e._dest]) tripMap[e._dest] = 0;
    tripMap[e._dest] += e.amount;
  });
  const barData = Object.entries(tripMap)
    .map(([k,v]) => ({ trip: k.length>12?k.slice(0,11)+'…':k, amount:v }))
    .sort((a,b)=>b.amount-a.amount).slice(0,8);

  if (loading) return <LoadingScreen/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your travel & expense overview</p>
        </div>
        <NotificationBell notifPath="/employee/notifications"/>
      </div>

      {/* Active advance banner */}
      {activeAdv && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="text-yellow-300 text-sm font-medium">
              Advance of {fmtMoney(activeAdv.amount)} — <span className="capitalize">{activeAdv.status}</span>
            </p>
            <p className="text-yellow-600 text-xs mt-0.5">{activeAdv.reason || 'No reason provided'}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize
            ${activeAdv.status==='approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
            {activeAdv.status}
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="This Month"    value={fmtMoney(thisMonthTotal)} icon={DollarSign}  accent="bg-indigo-600"  sub="total expenses"/>
        <StatCard title="Total Claimed" value={fmtMoney(totalClaimed)}   icon={BarChart2}  accent="bg-blue-600"   sub={`${fmtMoney(totalApproved)} approved`}/>
        <StatCard title="Active Trips"  value={stats.booked}             icon={Plane}       accent="bg-green-600"  sub="currently booked"/>
        <StatCard title="Pending"       value={stats.pending}            icon={Clock}       accent="bg-yellow-600" sub="awaiting approval"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Expenses by Category</CardTitle>
          {pieData.length === 0
            ? <div className="flex items-center justify-center h-52 text-gray-600 text-sm">No expense data yet</div>
            : <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={40}>
                    {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`₹${v.toLocaleString('en-IN')}`}
                    contentStyle={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', color:'#fff' }}/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
          }
        </Card>
        <Card>
          <CardTitle>Trip-wise Expense</CardTitle>
          {barData.length === 0
            ? <div className="flex items-center justify-center h-52 text-gray-600 text-sm">No trip expense data yet</div>
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={28}>
                  <XAxis dataKey="trip" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v=>`₹${v.toLocaleString('en-IN')}`}
                    contentStyle={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', color:'#fff' }}
                    cursor={{ fill:'rgba(99,102,241,0.06)' }}/>
                  <Bar dataKey="amount" fill="#6366f1" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* Recent travel history */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Travel History</CardTitle>
          {travels.length > 0 && (
            <button onClick={() => navigate('/employee/travels')}
              className="text-indigo-400 text-xs hover:underline flex items-center gap-1">
              View all <ChevronRight size={13}/>
            </button>
          )}
        </div>
        {travels.length === 0
          ? <div className="text-center text-gray-600 py-10 text-sm">No travel requests yet</div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['#','Route','Purpose','Dates','Status',''].map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium py-3 pr-4 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {travels.slice(0,8).map((t,i) => (
                    <tr key={t._id} onClick={() => navigate(`/employee/travels/${t._id}`)}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition cursor-pointer group">
                      <td className="py-3 pr-4"><SerialNo n={i+1}/></td>
                      <td className="py-3 pr-4 text-white font-medium whitespace-nowrap">{t.from} → {t.destination}</td>
                      <td className="py-3 pr-4 text-gray-400 max-w-[120px] truncate">{t.purpose}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.fromDate)}</td>
                      <td className="py-3 pr-4"><StatusBadge status={t.status}/></td>
                      <td className="py-3"><ChevronRight size={15} className="text-gray-700 group-hover:text-gray-400 transition"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>
    </div>
  );
}
