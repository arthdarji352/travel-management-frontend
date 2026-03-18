import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Wallet, FileText, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../../api/axios.js';
import { StatCard, Card, CardTitle, StatusBadge, LoadingScreen, fmtDate, fmtMoney, SA } from '../../components/employee/shared.jsx';
import NotificationBell from '../../components/employee/NotificationBell.jsx';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6'];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [travels,  setTravels]  = useState([]);
  const [advances, setAdvances] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [tr, adv, exp] = await Promise.all([
        API.get('/travel'), API.get('/advance'), API.get('/expense'),
      ]);
      setTravels(tr.data); setAdvances(adv.data); setExpenses(exp.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingTravels  = travels.filter(t => t.status === 'pending');
  const pendingAdvances = advances.filter(a => a.status === 'pending');
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const totalPending    = pendingTravels.length + pendingAdvances.length + pendingExpenses.length;

  const now = new Date();
  const thisMonthExp = expenses
    .filter(e => { const d=new Date(e.createdAt); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); })
    .reduce((s,e) => s+e.amount, 0);

  // ── Pie chart — team expenses by category ──────────────────────────────────
  const catMap = { travel:0, taxi:0, hotel:0, food:0, other:0 };
  expenses.forEach(e => { if (catMap[e.category] !== undefined) catMap[e.category] += e.amount; });
  const pieData = Object.entries(catMap)
    .map(([k,v]) => ({ name: k.charAt(0).toUpperCase()+k.slice(1), value: v }))
    .filter(d => d.value > 0);

  // ── Bar chart — monthly ────────────────────────────────────────────────────
  const monthMap = {};
  expenses.forEach(e => {
    const d = new Date(e.createdAt);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    monthMap[key] = (monthMap[key]||0) + e.amount;
  });
  const barData = Object.entries(monthMap).map(([month,amount]) => ({ month, amount }));

  const quickApprove = async (id, bookingType) => {
    try {
      await API.put(`/travel/${id}/approve`, { note:'Approved' });
      SA.success('Approved!', bookingType==='self' ? 'Employee can now add expenses.' : 'HR will book tickets.');
      load();
    } catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  const quickReject = async (id) => {
    const r = await SA.confirm('Reject this travel?', 'Employee will be notified.');
    if (!r.isConfirmed) return;
    try { await API.put(`/travel/${id}/reject`, { note:'Rejected by Manager' }); SA.success('Rejected',''); load(); }
    catch (err) { SA.error('Failed', err.response?.data?.message); }
  };

  if (loading) return <LoadingScreen color="border-purple-500"/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Team travel & expense overview</p>
        </div>
        <NotificationBell notifPath="/manager/notifications"/>
      </div>

      {/* Urgent banner */}
      {totalPending > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-yellow-400 flex-shrink-0"/>
          <p className="text-yellow-300 text-sm font-medium flex-1">
            {totalPending} item{totalPending>1?'s':''} waiting for your approval
            <span className="text-yellow-600 font-normal ml-2">
              ({pendingTravels.length} travel · {pendingAdvances.length} advance · {pendingExpenses.length} expense)
            </span>
          </p>
          <button onClick={() => navigate('/manager/travels')}
            className="flex items-center gap-1 text-yellow-400 text-xs hover:underline flex-shrink-0">
            Review <ChevronRight size={13}/>
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Travels"  value={pendingTravels.length}  icon={Clock}       accent="bg-yellow-600" sub={`${travels.length} total`}/>
        <StatCard title="Pending Advances" value={pendingAdvances.length} icon={Wallet}      accent="bg-orange-600" sub={`${advances.length} total`}/>
        <StatCard title="Pending Expenses" value={pendingExpenses.length} icon={FileText}    accent="bg-purple-600" sub={`${expenses.length} total`}/>
        <StatCard title="This Month Exp"   value={fmtMoney(thisMonthExp)} icon={CheckCircle} accent="bg-teal-600"   sub="all team expenses"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie — team category breakdown */}
        <Card>
          <CardTitle>Team Expenses by Category</CardTitle>
          {pieData.length === 0
            ? <div className="flex items-center justify-center h-52 text-gray-600 text-sm">No expense data yet</div>
            : <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={40}>
                    {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', color:'#fff' }}/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
          }
        </Card>

        {/* Bar — monthly */}
        <Card>
          <CardTitle>Monthly Expense Totals</CardTitle>
          {barData.length === 0
            ? <div className="flex items-center justify-center h-52 text-gray-600 text-sm">No expense data yet</div>
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={28}>
                  <XAxis dataKey="month" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v => `₹${Number(v).toLocaleString()}`}
                    contentStyle={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'10px', color:'#fff' }}
                    cursor={{ fill:'rgba(139,92,246,0.06)' }}/>
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </div>

      {/* Pending travels — quick action */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Pending Travel Requests</CardTitle>
          {pendingTravels.length > 5 && (
            <button onClick={() => navigate('/manager/travels')}
              className="text-purple-400 text-xs hover:underline flex items-center gap-1">
              View all <ChevronRight size={13}/>
            </button>
          )}
        </div>
        {pendingTravels.length === 0
          ? <div className="text-center text-gray-600 py-8 text-sm">No pending travel requests 🎉</div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Employee','Route','Purpose','Date','Booking','Action'].map(h => (
                      <th key={h} className="text-left text-gray-500 text-xs font-medium uppercase tracking-wide py-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingTravels.slice(0,5).map(t => (
                    <tr key={t._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {t.employee?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm">{t.employee?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-300 text-sm whitespace-nowrap">{t.from} → {t.destination}</td>
                      <td className="py-3 pr-4 text-gray-400 text-sm max-w-[120px] truncate">{t.purpose}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.fromDate)}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{t.bookingType==='self'?'🙋 Self':'🏢 HR'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => quickApprove(t._id, t.bookingType)}
                            className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium transition">
                            ✓ Approve
                          </button>
                          <button onClick={() => quickReject(t._id)}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition">
                            ✗ Reject
                          </button>
                        </div>
                      </td>
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
