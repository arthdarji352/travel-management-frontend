import { useEffect, useState } from 'react';
import { Plane, Clock, CheckCircle, Ticket, Users } from 'lucide-react';
import API from '../../api/axios.js';

const StatCard = ({ title, value, icon: Icon, accent, sub }) => (
  <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{title}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value ?? 0}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    approved:  'bg-yellow-500/10 text-yellow-400',
    booked:    'bg-green-500/10 text-green-400',
    completed: 'bg-gray-500/10 text-gray-400',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-500/10 text-gray-400'}`}>{status}</span>;
};

const HRDashboard = () => {
  const [pending,   setPending]   = useState([]);
  const [allTravel, setAllTravel] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pend, all] = await Promise.all([
          API.get('/hr/pending'),
          API.get('/travel'),
        ]);
        setPending(pend.data);
        setAllTravel(all.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const stats = {
    pendingBooking: pending.length,
    booked:         allTravel.filter(t => t.status === 'booked').length,
    completed:      allTravel.filter(t => t.status === 'completed').length,
    totalHR:        allTravel.filter(t => t.bookingType === 'hr').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div>
        <h1 className="text-white text-2xl font-bold">HR Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage travel bookings for employees</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Booking"  value={stats.pendingBooking} icon={Clock}        accent="bg-yellow-600" sub="Awaiting HR action" />
        <StatCard title="Booked Trips"     value={stats.booked}         icon={Ticket}       accent="bg-green-600"  sub="Tickets arranged"  />
        <StatCard title="Completed Trips"  value={stats.completed}      icon={CheckCircle}  accent="bg-blue-600"   sub="Archived"          />
        <StatCard title="HR-Booked Total"  value={stats.totalHR}        icon={Users}        accent="bg-purple-600" sub="HR booking type"    />
      </div>

      {/* Pending list */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Approved — Awaiting Booking</h2>
          {stats.pendingBooking > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">
              {stats.pendingBooking} pending
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="text-center text-gray-600 py-10 text-sm">
            <Plane size={36} className="mx-auto mb-3 text-gray-700" />
            No pending bookings right now
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Employee', 'Route', 'Purpose', 'Departure', 'Return'].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wide py-2 pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(t => (
                  <tr key={t._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="py-3 pr-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {t.employee?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm">{t.employee?.name}</p>
                          <p className="text-gray-600 text-xs">{t.employee?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-5 text-gray-300">{t.from} → {t.destination}</td>
                    <td className="py-3 pr-5 text-gray-400 max-w-28 truncate">{t.purpose}</td>
                    <td className="py-3 pr-5 text-gray-500 text-xs whitespace-nowrap">{new Date(t.fromDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(t.toDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent all travel */}
      <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-4">All Travel — Recent</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {allTravel.slice(0, 10).map(t => (
            <div key={t._id} className="flex items-center justify-between bg-gray-900/40 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {t.employee?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm">{t.employee?.name}</p>
                  <p className="text-gray-500 text-xs">{t.from} → {t.destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 text-xs">{t.bookingType === 'self' ? '🙋 Self' : '🏢 HR'}</span>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
