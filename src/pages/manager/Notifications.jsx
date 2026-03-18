import { useEffect, useState, useCallback } from 'react';
import { Bell, RefreshCw, Check } from 'lucide-react';
import API from '../../api/axios.js';
import { LoadingScreen, fmtRelTime, fmtDate } from '../../components/employee/shared.jsx';

const groupByDate = (list) => {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const groups    = { Today:[], Yesterday:[], 'Earlier':[] };
  list.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime())     groups['Today'].push(n);
    else if (d.getTime() === yesterday.getTime()) groups['Yesterday'].push(n);
    else groups['Earlier'].push(n);
  });
  return groups;
};

export default function NotificationsPage() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | unread | read

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await API.get('/notifications?limit=100'); setList(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    try { await API.put('/notifications/read'); setList(prev => prev.map(n => ({ ...n, isRead:true }))); }
    catch (_) {}
  };

  const filtered = list.filter(n =>
    filter === 'all'    ? true :
    filter === 'unread' ? !n.isRead :
    n.isRead
  );

  const groups  = groupByDate(filtered);
  const unread  = list.filter(n => !n.isRead).length;

  if (loading) return <LoadingScreen/>;

  return (
    <div className="p-6 bg-gray-950 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unread > 0 ? `${unread} unread notification${unread>1?'s':''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition">
              <Check size={13}/> Mark all read
            </button>
          )}
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 bg-gray-900 hover:bg-gray-800 border border-white/5 rounded-xl transition">
            <RefreshCw size={13}/> Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key:'all',    label:`All (${list.length})` },
          { key:'unread', label:`Unread (${unread})` },
          { key:'read',   label:`Read (${list.length - unread})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-white/5'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl py-20 text-center">
          <Bell size={36} className="text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">No notifications found.</p>
        </div>
      ) : (
        Object.entries(groups).map(([group, items]) => items.length === 0 ? null : (
          <div key={group}>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-3">{group}</p>
            <div className="space-y-2">
              {items.map(n => (
                <div key={n._id}
                  className={`flex items-start gap-4 rounded-2xl px-5 py-4 border transition
                    ${n.isRead
                      ? 'bg-[#0d1117] border-white/5'
                      : 'bg-indigo-500/5 border-indigo-500/15'
                    }`}>
                  {/* Dot */}
                  <div className="flex-shrink-0 mt-1">
                    {n.isRead
                      ? <div className="w-2 h-2 rounded-full bg-gray-700"/>
                      : <div className="w-2 h-2 rounded-full bg-indigo-400"/>
                    }
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${n.isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                      {n.message}
                    </p>
                    <p className="text-gray-600 text-xs mt-1.5">{fmtRelTime(n.createdAt)} · {fmtDate(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
