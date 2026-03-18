import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import API from '../../api/axios.js';
import { fmtRelTime } from './shared.jsx';

export default function NotificationBell({ notifPath = '/employee/notifications' }) {
  const navigate = useNavigate();
  const [list,    setList]    = useState([]);
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef();

  const unread = list.filter(n => !n.isRead).length;

  const loadNotifs = async () => {
    setLoading(true);
    try { const { data } = await API.get('/notifications'); setList(data); }
    catch (_) {} finally { setLoading(false); }
  };

  const markAll = async () => {
    try { await API.put('/notifications/read'); }
    catch (_) {}
    setList(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const open = () => {
    setShow(v => !v);
    if (!show) { loadNotifs(); markAll(); }
  };

  // load unread count on mount
  useEffect(() => {
    API.get('/notifications').then(r => setList(r.data)).catch(() => {});
  }, []);

  // close on outside click
  useEffect(() => {
    const fn = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={open}
        className="relative p-2.5 bg-[#0d1117] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 transition">
        <Bell size={20}/>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 top-12 w-80 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-white text-sm font-semibold flex items-center gap-2">
              <Bell size={14} className="text-indigo-400"/>
              Notifications
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">{unread} new</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShow(false); navigate(notifPath); }}
                className="text-indigo-400 text-xs hover:underline">
                View all
              </button>
              <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white transition">
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {loading
              ? <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              : list.length === 0
                ? <p className="text-gray-600 text-sm text-center py-8">No notifications yet</p>
                : list.slice(0,8).map(n => (
                    <div key={n._id}
                      className={`px-4 py-3 border-b border-white/[0.04] ${n.isRead ? '' : 'bg-indigo-500/5'}`}>
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5"/>}
                        <div className={n.isRead ? 'pl-3.5' : ''}>
                          <p className={`text-sm leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-gray-200'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{fmtRelTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
