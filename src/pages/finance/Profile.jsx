import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Loader, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import API from '../../api/axios.js';
import Swal from 'sweetalert2';

const Profile = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [show,   setShow]   = useState({ cur: false, nw: false, con: false });

  const curRef = useRef();
  const newRef = useRef();
  const conRef = useRef();

  const toggle = key => setShow(s => ({ ...s, [key]: !s[key] }));

  const handleSubmit = async e => {
    e.preventDefault();
    const currentPassword = curRef.current.value;
    const newPassword     = newRef.current.value;
    const confirmPassword = conRef.current.value;

    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Mismatch!', text: 'New password and confirm must match.', background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' });
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire({ icon: 'error', title: 'Too Short!', text: 'Min 6 characters required.', background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' });
      return;
    }
    setSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword, newPassword });
      curRef.current.value = '';
      newRef.current.value = '';
      conRef.current.value = '';
      Swal.fire({ icon: 'success', title: 'Password Updated!', background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed!', text: err.response?.data?.message || 'Something went wrong.', background: '#0d1117', color: '#fff', confirmButtonColor: '#2563eb' });
    } finally { setSaving(false); }
  };

  const ic = "w-full bg-gray-900 border border-white/10 text-white rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-600";

  const PassField = ({ label, refProp, showKey, placeholder, autoComplete }) => (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input ref={refProp} type={show[showKey] ? 'text' : 'password'} placeholder={placeholder} autoComplete={autoComplete} required className={ic} />
        <button type="button" tabIndex={-1} onClick={() => toggle(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your account</p>
        </div>
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20 flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-lg font-bold">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="mt-2 inline-block px-2.5 py-0.5 bg-teal-500/10 text-teal-400 text-xs rounded-full capitalize border border-teal-500/20">{user?.role}</span>
          </div>
        </div>
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-400" /> Change Password</h2>
          <p className="text-gray-600 text-xs mb-5">Choose a strong password.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PassField label="Current Password"     refProp={curRef} showKey="cur" placeholder="Current password"  autoComplete="current-password" />
            <PassField label="New Password"          refProp={newRef} showKey="nw"  placeholder="Min 6 characters" autoComplete="new-password" />
            <PassField label="Confirm New Password"  refProp={conRef} showKey="con" placeholder="Repeat password"  autoComplete="new-password" />
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition mt-2">
              {saving ? <><Loader size={15} className="animate-spin" /> Updating...</> : <><Lock size={15} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
