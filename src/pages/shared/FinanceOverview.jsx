import { useEffect, useState } from 'react';
import API from '../../api/axios.js';
import { LoadingScreen, fmtMoney, fmtDate } from '../../components/employee/shared.jsx';

const modeLabel = { cash:'Cash', bank_transfer:'Bank Transfer', upi:'UPI' };

const StatusPill = ({ val, color }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${color}`}>{val}</span>
);

const statusColor = s => ({
  disbursed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  approved:  'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reimbursed:'bg-blue-500/10 text-blue-400 border-blue-500/20',
}[s] || 'bg-gray-500/10 text-gray-400 border-gray-500/20');

export default function FinanceOverview() {
  const [rows,      setRows]      = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [empFilter, setEmpFilter] = useState('');
  const [search,    setSearch]    = useState('');

  const load = (employeeId = '') => {
    setLoading(true);
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    API.get(`/finance/ledger${params}`)
      .then(r => { setRows(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    API.get('/finance/employees').then(r => setEmployees(r.data)).catch(() => {});
    load();
  }, []);

  const handleEmpFilter = (e) => { setEmpFilter(e.target.value); load(e.target.value); };

  const filtered = rows.filter(r =>
    !search ||
    r.travel?.destination?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdvance    = filtered.reduce((s,r) => s+(r.advance?.amount||0), 0);
  const totalDisbursed  = filtered.filter(r => r.advance?.status==='disbursed').reduce((s,r) => s+(r.advance?.amount||0), 0);
  const totalExpenses   = filtered.reduce((s,r) => s+(r.expenses?.totalApproved||0), 0);
  const totalReimbursed = filtered.reduce((s,r) => s+(r.expenses?.totalReimbursed||0), 0);

  if (loading) return <LoadingScreen color="border-teal-500"/>;

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-white text-2xl font-bold">Finance Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Advance disbursements & expense reimbursements</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Advance',      value: fmtMoney(totalAdvance),    border:'border-yellow-500/30', text:'text-yellow-400', bg:'bg-yellow-500/5'  },
          { label:'Total Disbursed',    value: fmtMoney(totalDisbursed),  border:'border-green-500/30',  text:'text-green-400',  bg:'bg-green-500/5'   },
          { label:'Approved Expenses',  value: fmtMoney(totalExpenses),   border:'border-blue-500/30',   text:'text-blue-400',   bg:'bg-blue-500/5'    },
          { label:'Total Reimbursed',   value: fmtMoney(totalReimbursed), border:'border-teal-500/30',   text:'text-teal-400',   bg:'bg-teal-500/5'    },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
            <p className="text-gray-400 text-xs mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.text}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee or destination..."
            className="w-full bg-[#0d1117] border border-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/40 transition"/>
        </div>
        <select value={empFilter} onChange={handleEmpFilter}
          className="bg-[#0d1117] border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500/40 min-w-[180px]">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl py-16 text-center text-gray-600 text-sm">
          No financial records found
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <div key={i} className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition">
              {/* Trip header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {r.employee?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{r.employee?.name}</p>
                    <p className="text-gray-500 text-xs truncate">
                      {r.travel?.from} → {r.travel?.destination} &nbsp;·&nbsp; {r.travel?.purpose}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <StatusPill val={r.travel?.status} color={statusColor(r.travel?.status)}/>
                  <span className="text-gray-600 text-xs">{fmtDate(r.travel?.fromDate)}</span>
                </div>
              </div>

              {/* Finance details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">

                {/* Advance column */}
                <div className="px-5 py-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block"/>
                    Advance Payment
                  </p>
                  {r.advance ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Requested</span>
                        <span className="text-white font-semibold">{fmtMoney(r.advance.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Status</span>
                        <StatusPill val={r.advance.status} color={statusColor(r.advance.status)}/>
                      </div>
                      {r.advance.status === 'disbursed' && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Mode</span>
                            <span className="text-gray-200 text-sm">{modeLabel[r.advance.paymentMode] || r.advance.paymentMode}</span>
                          </div>
                          {r.advance.referenceNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-sm">Ref No.</span>
                              <span className="text-gray-200 text-sm font-mono">{r.advance.referenceNumber}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No advance requested</p>
                  )}
                </div>

                {/* Expense column */}
                <div className="px-5 py-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"/>
                    Expense Reimbursement
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Approved</span>
                      <span className="text-white font-semibold">{fmtMoney(r.expenses?.totalApproved)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Reimbursed</span>
                      <span className="text-green-400 font-semibold">{fmtMoney(r.expenses?.totalReimbursed)}</span>
                    </div>
                    {r.expenses?.totalApproved > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Balance</span>
                        <span className={`font-semibold text-sm ${(r.expenses.totalApproved - r.expenses.totalReimbursed) > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
                          {fmtMoney(r.expenses.totalApproved - r.expenses.totalReimbursed)}
                        </span>
                      </div>
                    )}
                    {r.expenses?.reimbursedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Date</span>
                        <span className="text-gray-300 text-sm">{fmtDate(r.expenses.reimbursedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
