import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import API from '../../api/axios';

const badge = (text, color) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>{text}</span>
);

const modeLabel = { cash: 'Cash', bank_transfer: 'Bank Transfer', upi: 'UPI' };

export default function Ledger() {
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
    API.get('/finance/employees').then(r => setEmployees(r.data));
    load();
  }, []);

  const handleEmpFilter = (e) => { setEmpFilter(e.target.value); load(e.target.value); };

  const filtered = rows.filter(r =>
    !search || r.travel.destination?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Finance Ledger</h1>
        <p className="text-gray-400 text-sm mt-1">Complete payment history — travel-wise &amp; employee-wise</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or destination..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select value={empFilter} onChange={handleEmpFilter}
            className="bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[180px]">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No records found.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    {r.employee?.name?.[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{r.employee?.name}</p>
                    <p className="text-gray-500 text-xs">{r.employee?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">✈️ {r.travel.from} → {r.travel.destination}</p>
                  <p className="text-gray-600 text-xs">{new Date(r.travel.fromDate).toLocaleDateString('en-IN')} — {new Date(r.travel.toDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Advance + Expense side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                {/* Advance */}
                <div className="p-4">
                  <p className="text-gray-500 text-xs mb-3 font-semibold">ADVANCE</p>
                  {r.advance ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Amount</span>
                        <span className="text-yellow-400 font-bold">₹{r.advance.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Status</span>
                        {r.advance.status === 'disbursed'
                          ? badge('DISBURSED', 'bg-green-500/10 text-green-400 border-green-500/20')
                          : badge(r.advance.status.toUpperCase(), 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20')}
                      </div>
                      {r.advance.status === 'disbursed' && <>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Mode</span>
                          <span className="text-white text-sm">{modeLabel[r.advance.paymentMode] || r.advance.paymentMode}</span>
                        </div>
                        {r.advance.referenceNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Ref No</span>
                            <span className="text-blue-400 text-sm font-mono">{r.advance.referenceNumber}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Disbursed On</span>
                          <span className="text-gray-300 text-sm">{new Date(r.advance.disbursedAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        {r.advance.disbursedBy && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">By</span>
                            <span className="text-gray-300 text-sm">{r.advance.disbursedBy}</span>
                          </div>
                        )}
                      </>}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No advance requested</p>
                  )}
                </div>

                {/* Expenses */}
                <div className="p-4">
                  <p className="text-gray-500 text-xs mb-3 font-semibold">EXPENSES</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total Claimed</span>
                      <span className="text-white font-semibold">₹{r.expenses.totalClaimed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Approved</span>
                      <span className="text-green-400 font-semibold">₹{r.expenses.totalApproved.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Reimbursed</span>
                      {r.expenses.reimbursed
                        ? badge('YES', 'bg-green-500/10 text-green-400 border-green-500/20')
                        : badge('PENDING', 'bg-orange-500/10 text-orange-400 border-orange-500/20')}
                    </div>
                    {r.expenses.reimbursed && <>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Mode</span>
                        <span className="text-white text-sm">{modeLabel[r.expenses.paymentMode] || r.expenses.paymentMode}</span>
                      </div>
                      {r.expenses.referenceNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Ref No</span>
                          <span className="text-blue-400 text-sm font-mono">{r.expenses.referenceNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">On</span>
                        <span className="text-gray-300 text-sm">{new Date(r.expenses.reimbursedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </>}
                  </div>
                  {/* Balance */}
                  <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between">
                    <span className="text-gray-400 text-sm font-semibold">Balance Due</span>
                    <span className={`font-bold ${r.balanceDue > 0 ? 'text-orange-400' : r.balanceDue < 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      {r.balanceDue === 0 ? 'Settled' : r.balanceDue < 0 ? `₹${Math.abs(r.balanceDue).toLocaleString()} (Refund)` : `₹${r.balanceDue.toLocaleString()}`}
                    </span>
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
