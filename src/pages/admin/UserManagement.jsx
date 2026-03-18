import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Trash2, Edit2, Eye, X, Loader, Search } from 'lucide-react';
import API from '../../api/axios.js';
import Swal from 'sweetalert2';

const ROLES = ['employee', 'manager', 'hr', 'finance'];

const Badge = ({ role }) => {
  const colors = {
    employee: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    manager:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    hr:       'bg-green-500/10 text-green-400 border-green-500/20',
    finance:  'bg-teal-500/10 text-teal-400 border-teal-500/20',
    admin:    'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${colors[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{role}</span>;
};

// ── Input style ──────────────────────────────────────────────────────────────
const IS = { width:'100%', background:'#1f2937', border:'1px solid #374151', borderRadius:'8px', color:'#fff', padding:'10px 12px', fontSize:'14px', boxSizing:'border-box', outline:'none' };
const LS = { color:'#9ca3af', fontSize:'12px', display:'block', marginBottom:'6px' };

// ── Create Modal (fully uncontrolled refs, portal) ───────────────────────────
const CreateModal = ({ onClose, onDone }) => {
  const nameRef  = useRef();
  const emailRef = useRef();
  const passRef  = useRef();
  const roleRef  = useRef();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await API.post('/admin/users', {
        name:     nameRef.current.value.trim(),
        email:    emailRef.current.value.trim(),
        password: passRef.current.value,
        role:     roleRef.current.value,
      });
      onDone();
      Swal.fire({ icon:'success', title:'User Created!', background:'#0d1117', color:'#fff', confirmButtonColor:'#2563eb' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'16px', width:'100%', maxWidth:'440px', padding:'0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #1f2937' }}>
          <h3 style={{ color:'#fff', fontWeight:700, fontSize:'16px' }}>Create New User</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#f87171', padding:'10px 14px', fontSize:'13px' }}>{error}</div>}
          <div>
            <label style={LS}>FULL NAME *</label>
            <input ref={nameRef} style={IS} placeholder="John Doe" required autoFocus />
          </div>
          <div>
            <label style={LS}>EMAIL ADDRESS *</label>
            <input ref={emailRef} type="email" style={IS} placeholder="john@company.com" required />
          </div>
          <div>
            <label style={LS}>PASSWORD *</label>
            <input ref={passRef} type="password" style={IS} placeholder="Min 6 characters" required />
          </div>
          <div>
            <label style={LS}>ROLE *</label>
            <select ref={roleRef} style={IS}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'10px', background:'#1f2937', border:'1px solid #374151', borderRadius:'10px', color:'#9ca3af', cursor:'pointer', fontSize:'14px' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex:1, padding:'10px', background:'#2563eb', border:'none', borderRadius:'10px', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ── Edit Modal (fully uncontrolled refs, portal) ─────────────────────────────
const EditModal = ({ user, onClose, onDone }) => {
  const nameRef = useRef();
  const passRef = useRef();
  const roleRef = useRef();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const payload = { name: nameRef.current.value.trim(), role: roleRef.current.value };
    if (passRef.current.value) payload.password = passRef.current.value;
    try {
      await API.put(`/admin/users/${user._id}`, payload);
      onDone();
      Swal.fire({ icon:'success', title:'User Updated!', background:'#0d1117', color:'#fff', confirmButtonColor:'#2563eb' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
      setSaving(false);
    }
  };

  return createPortal(
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'16px', width:'100%', maxWidth:'440px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #1f2937' }}>
          <h3 style={{ color:'#fff', fontWeight:700, fontSize:'16px' }}>Edit User</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', color:'#f87171', padding:'10px 14px', fontSize:'13px' }}>{error}</div>}
          {/* Email read-only */}
          <div>
            <label style={LS}>EMAIL (cannot change)</label>
            <div style={{ ...IS, color:'#6b7280', background:'#111827' }}>{user.email}</div>
          </div>
          <div>
            <label style={LS}>FULL NAME *</label>
            <input ref={nameRef} style={IS} defaultValue={user.name} required autoFocus />
          </div>
          <div>
            <label style={LS}>NEW PASSWORD (leave blank to keep)</label>
            <input ref={passRef} type="password" style={IS} placeholder="Leave blank to keep current" />
          </div>
          <div>
            <label style={LS}>ROLE *</label>
            <select ref={roleRef} style={IS} defaultValue={user.role}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:'10px', background:'#1f2937', border:'1px solid #374151', borderRadius:'10px', color:'#9ca3af', cursor:'pointer', fontSize:'14px' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex:1, padding:'10px', background:'#d97706', border:'none', borderRadius:'10px', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ data, onClose }) => createPortal(
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
    <div style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:'16px', width:'100%', maxWidth:'480px', maxHeight:'85vh', overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #1f2937' }}>
        <h3 style={{ color:'#fff', fontWeight:700, fontSize:'16px' }}>User Details</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={20}/></button>
      </div>
      <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'22px', fontWeight:700, flexShrink:0 }}>
            {data.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color:'#fff', fontWeight:600, fontSize:'16px' }}>{data.user?.name}</p>
            <p style={{ color:'#9ca3af', fontSize:'13px' }}>{data.user?.email}</p>
            <Badge role={data.user?.role} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div style={{ background:'#1f2937', borderRadius:'10px', padding:'14px' }}>
            <p style={{ color:'#6b7280', fontSize:'11px' }}>Total Travels</p>
            <p style={{ color:'#fff', fontWeight:700, fontSize:'22px' }}>{data.travels?.length || 0}</p>
          </div>
          <div style={{ background:'#1f2937', borderRadius:'10px', padding:'14px' }}>
            <p style={{ color:'#6b7280', fontSize:'11px' }}>Total Expenses</p>
            <p style={{ color:'#fff', fontWeight:700, fontSize:'22px' }}>₹{data.totalExpenseAmount?.toLocaleString() || 0}</p>
          </div>
        </div>
        {data.travels?.length > 0 && (
          <div>
            <p style={{ color:'#6b7280', fontSize:'12px', fontWeight:600, marginBottom:'8px' }}>RECENT TRAVELS</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'200px', overflowY:'auto' }}>
              {data.travels.slice(0, 5).map(t => (
                <div key={t._id} style={{ background:'#1f2937', borderRadius:'8px', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#fff', fontSize:'13px' }}>{t.from} → {t.destination}</span>
                  <Badge role={t.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>,
  document.body
);

// ── Main Page ────────────────────────────────────────────────────────────────
const UserManagement = () => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [viewData,   setViewData]   = useState(null);

  const fetchUsers = async () => {
    try { const { data } = await API.get('/admin/users'); setUsers(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({ title:'Delete user?', text:'This cannot be undone.', icon:'warning', showCancelButton:true, confirmButtonColor:'#dc2626', cancelButtonColor:'#374151', background:'#0d1117', color:'#fff', confirmButtonText:'Yes, delete' });
    if (!result.isConfirmed) return;
    try { await API.delete(`/admin/users/${id}`); fetchUsers(); }
    catch (err) { Swal.fire({ icon:'error', title:'Failed', text: err.response?.data?.message || 'Delete failed', background:'#0d1117', color:'#fff' }); }
  };

  const openView = async (user) => {
    try { const { data } = await API.get(`/admin/users/${user._id}`); setViewData(data); }
    catch (err) { console.error(err); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Portalled modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); fetchUsers(); }} />}
      {editUser   && <EditModal   user={editUser} onClose={() => setEditUser(null)} onDone={() => { setEditUser(null); fetchUsers(); }} />}
      {viewData   && <ViewModal   data={viewData} onClose={() => setViewData(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-500/20">
          <Plus size={18}/> New User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role..."
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition" />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Name</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Email</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Role</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Last Travel</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Total Expenses</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4"><Badge role={user.role} /></td>
                    <td className="px-6 py-4 text-gray-400">
                      {user.lastTravel ? (
                        <span>{user.lastTravel.destination} <Badge role={user.lastTravel.status} /></span>
                      ) : <span className="text-gray-600">No travel yet</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-300">₹{user.totalExpenses?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openView(user)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"><Eye size={16}/></button>
                        <button onClick={() => setEditUser(user)} className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(user._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
