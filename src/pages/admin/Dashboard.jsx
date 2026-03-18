import { useEffect, useState } from 'react';
import { Users, Plane, CheckCircle, XCircle, Clock, TrendingUp, BookOpen, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../../api/axios.js';

const PIE_COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6'];

const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;

const StatCard = ({ title, value, icon, color, sub }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-xs mb-0.5">{title}</p>
      <p className="text-white text-2xl font-bold leading-tight">{value ?? '—'}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending:'bg-yellow-500/10 text-yellow-400', approved:'bg-green-500/10 text-green-400',
    rejected:'bg-red-500/10 text-red-400', booked:'bg-blue-500/10 text-blue-400',
    completed:'bg-purple-500/10 text-purple-400',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-500/10 text-gray-400'}`}>{status}</span>;
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const c = stats?.cards || {};

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Full overview of your travel & expense system.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users"       value={c.totalUsers}          icon={<Users      size={20} className="text-white"/>} color="bg-blue-600"   />
        <StatCard title="Total Travels"     value={c.totalTravels}        icon={<Plane      size={20} className="text-white"/>} color="bg-indigo-600" />
        <StatCard title="Pending Approval"  value={c.pendingTravels}      icon={<Clock      size={20} className="text-white"/>} color="bg-yellow-600" />
        <StatCard title="Total Expenses"    value={fmt(c.totalExpenseAmount||0)} icon={<DollarSign size={20} className="text-white"/>} color="bg-green-600" sub="approved expenses"/>
        <StatCard title="Approved Travels"  value={c.approvedTravels}     icon={<CheckCircle size={20} className="text-white"/>} color="bg-teal-600"  />
        <StatCard title="Rejected Travels"  value={c.rejectedTravels}     icon={<XCircle    size={20} className="text-white"/>} color="bg-red-600"   />
        <StatCard title="Booked Travels"    value={c.bookedTravels}       icon={<BookOpen   size={20} className="text-white"/>} color="bg-purple-600"/>
        <StatCard title="Completed Trips"   value={c.completedTravels}    icon={<TrendingUp size={20} className="text-white"/>} color="bg-cyan-600"  />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Expenses by Category</h2>
          {stats?.pieChart?.every(p => p.amount === 0)
            ? <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No expense data yet</div>
            : <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.pieChart} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({category}) => category}>
                    {stats.pieChart.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => `₹${v}`} contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',color:'#fff'}}/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Monthly Expenses (Last 6 Months)</h2>
          {!stats?.barChart?.length
            ? <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No monthly data yet</div>
            : <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.barChart}>
                  <XAxis dataKey="month" tick={{fill:'#9ca3af',fontSize:11}}/>
                  <YAxis tick={{fill:'#9ca3af',fontSize:11}}/>
                  <Tooltip formatter={v => `₹${v}`} contentStyle={{background:'#1f2937',border:'1px solid #374151',borderRadius:'8px',color:'#fff'}}/>
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Recent Travels */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Recent Travel Requests</h2>
        {!stats?.recentTravels?.length
          ? <div className="text-center text-gray-500 py-8 text-sm">No travel requests yet</div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Employee','Route','Purpose','Date','Status'].map(h => (
                      <th key={h} className="text-left text-gray-400 font-medium py-3 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTravels.map(t => (
                    <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="py-3 px-3 text-white">{t.employee?.name}</td>
                      <td className="py-3 px-3 text-gray-300 text-xs">{t.from} → {t.destination}</td>
                      <td className="py-3 px-3 text-gray-400">{t.purpose}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{new Date(t.fromDate).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><StatusBadge status={t.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
