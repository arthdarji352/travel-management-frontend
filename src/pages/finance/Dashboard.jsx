import { useEffect, useState } from 'react';
import { Wallet, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
  <Link to={to || '#'} className={`bg-gray-900 border ${color} rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition`}>
    <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('/30', '/10')}`}>
      <Icon size={22} className={color.replace('border-', 'text-').replace('/30', '')} />
    </div>
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
    {to && <ArrowRight size={14} className="ml-auto text-gray-600" />}
  </Link>
);

export default function FinanceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/finance/summary').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Manage disbursements and reimbursements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Clock}       label="Pending Disbursements"   value={stats?.pendingDisbursements  ?? 0} sub="Advances approved by manager"      color="border-yellow-500/30" to="/finance/disbursements" />
        <StatCard icon={Clock}       label="Pending Reimbursements"  value={stats?.pendingReimbursements ?? 0} sub="Expenses awaiting payment"         color="border-orange-500/30" to="/finance/reimbursements" />
        <StatCard icon={CheckCircle} label="Disbursed (Total)"       value={stats?.totalDisbursed        ?? 0} sub="Advances fully paid"               color="border-green-500/30" />
        <StatCard icon={CheckCircle} label="Reimbursed (Total)"      value={stats?.totalReimbursed       ?? 0} sub="Expense batches fully reimbursed"  color="border-blue-500/30" />
        <StatCard icon={Wallet}      label="Disbursed This Month"    value={`₹${(stats?.disbursedAmountThisMonth ?? 0).toLocaleString()}`}  sub="Advance payments"  color="border-purple-500/30" />
        <StatCard icon={TrendingUp}  label="Reimbursed This Month"   value={`₹${(stats?.reimbursedAmountThisMonth ?? 0).toLocaleString()}`} sub="Expense payments" color="border-indigo-500/30" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/finance/disbursements" className="bg-gray-900 border border-yellow-500/20 rounded-2xl p-5 hover:border-yellow-500/40 transition">
          <h3 className="text-white font-semibold mb-1">💰 Advance Disbursements</h3>
          <p className="text-gray-400 text-sm">Manager-approved advances waiting to be paid to employees.</p>
          <span className="mt-3 inline-block text-yellow-400 text-sm font-medium">View pending →</span>
        </Link>
        <Link to="/finance/reimbursements" className="bg-gray-900 border border-orange-500/20 rounded-2xl p-5 hover:border-orange-500/40 transition">
          <h3 className="text-white font-semibold mb-1">💳 Expense Reimbursements</h3>
          <p className="text-gray-400 text-sm">Approved expenses waiting to be reimbursed to employees.</p>
          <span className="mt-3 inline-block text-orange-400 text-sm font-medium">View pending →</span>
        </Link>
        <Link to="/finance/ledger" className="bg-gray-900 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition md:col-span-2">
          <h3 className="text-white font-semibold mb-1">📊 Full Ledger</h3>
          <p className="text-gray-400 text-sm">Complete payment history — employee-wise, travel-wise with all references.</p>
          <span className="mt-3 inline-block text-blue-400 text-sm font-medium">Open ledger →</span>
        </Link>
      </div>
    </div>
  );
}
