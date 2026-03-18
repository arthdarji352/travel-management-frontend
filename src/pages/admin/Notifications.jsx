import { useEffect, useState } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';
import API from '../../api/axios.js';

const fmtDt = d => {
  const dt = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - dt) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
};

const roleColor = {
  employee:'bg-blue-500/10 text-blue-400', manager:'bg-purple-500/10 text-purple-400',
  hr:'bg-green-500/10 text-green-400',     finance:'bg-teal-500/10 text-teal-400',
  admin:'bg-red-500/10 text-red-400',
};

export default function Notifications() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const load = () => {
    setLoading(true);
    API.get('/admin/notifications')
      .then(r => setList(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const roles = ['all', 'employee', 'manager', 'hr', 'finance'];

  const filtered = list.filter(n => {
    const matchRole   = filter === 'all' || n.user?.role === filter;
    const matchSearch = n.message?.toLowerCase().includes(search.toLowerCase()) ||
                        n.user?.name?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">All Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">System-wide activity from all roles</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">
          <RefreshCw size={14}/> Refresh
        </button>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition
              ${filter===r ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {r} {r==='all' ? `(${list.length})` : `(${list.filter(n=>n.user?.role===r).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..."
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"/>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Bell size={32} className="mx-auto mb-3 opacity-30"/>
          <p>No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n._id} className="flex items-start gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition">
              <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                {n.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-white text-sm font-medium">{n.user?.name || 'Unknown'}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${roleColor[n.user?.role]||'bg-gray-500/10 text-gray-400'}`}>
                    {n.user?.role}
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{n.message}</p>
              </div>
              <p className="text-gray-500 text-xs flex-shrink-0">{fmtDt(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
