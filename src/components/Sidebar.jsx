import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Users, Plane, LogOut, Menu, X,
  Briefcase, UserCircle, CheckSquare, Wallet, Ticket,
  List, CreditCard, BookOpen, BarChart3, Bell, ClipboardList,
} from 'lucide-react';
import { useState } from 'react';

const linksByRole = {
  admin: [
    { to: '/admin/dashboard',       Icon: LayoutDashboard, label: 'Dashboard'       },
    { to: '/admin/users',           Icon: Users,           label: 'User Management' },
    { to: '/admin/travels',         Icon: Plane,           label: 'Travel List'     },
    { to: '/admin/finance',         Icon: BarChart3,       label: 'Finance'         },
    { to: '/admin/notifications',   Icon: Bell,            label: 'Notifications'   },
  ],
  employee: [
    { to: '/employee/dashboard',       Icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/employee/travels',         Icon: Briefcase,       label: 'Travel Manage'  },
    { to: '/employee/notifications',   Icon: Bell,            label: 'Notifications'  },
    { to: '/employee/profile',         Icon: UserCircle,      label: 'Profile'        },
  ],
  manager: [
    { to: '/manager/dashboard',        Icon: LayoutDashboard, label: 'Dashboard'         },
    { to: '/manager/travels',          Icon: CheckSquare,     label: 'Travel Approvals'  },
    { to: '/manager/advances',         Icon: Wallet,          label: 'Advance Approvals' },
    { to: '/manager/my-travels',       Icon: Briefcase,       label: 'My Travels'        },
    { to: '/manager/finance',          Icon: BarChart3,       label: 'Finance'           },
    { to: '/manager/notifications',    Icon: Bell,            label: 'Notifications'     },
    { to: '/manager/profile',          Icon: UserCircle,      label: 'Profile'           },
  ],
  hr: [
    { to: '/hr/dashboard',             Icon: LayoutDashboard, label: 'Dashboard'         },
    { to: '/hr/travel-approvals',      Icon: CheckSquare,     label: 'Travel Approvals'  },
    { to: '/hr/advance-approvals',     Icon: Wallet,          label: 'Advance Approvals' },
    { to: '/hr/book',                  Icon: Ticket,          label: 'Book Travel'       },
    { to: '/hr/travels',               Icon: List,            label: 'All Travels'       },
    { to: '/hr/notifications',         Icon: Bell,            label: 'Notifications'     },
    { to: '/hr/profile',               Icon: UserCircle,      label: 'Profile'           },
  ],
  finance: [
    { to: '/finance/dashboard',        Icon: LayoutDashboard, label: 'Dashboard'       },
    { to: '/finance/disbursements',    Icon: Wallet,          label: 'Disbursements'   },
    { to: '/finance/reimbursements',   Icon: CreditCard,      label: 'Reimbursements'  },
    { to: '/finance/ledger',           Icon: BookOpen,        label: 'Ledger'          },
    { to: '/finance/profile',          Icon: UserCircle,      label: 'Profile'         },
  ],
};

const accentByRole = {
  admin:    'bg-blue-600',
  employee: 'bg-indigo-600',
  manager:  'bg-purple-600',
  hr:       'bg-green-600',
  finance:  'bg-teal-600',
};

const roleColor = {
  admin:    'text-blue-400',
  manager:  'text-purple-400',
  hr:       'text-green-400',
  employee: 'text-indigo-400',
  finance:  'text-teal-400',
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const links  = linksByRole[user?.role] || [];
  const accent = accentByRole[user?.role] || 'bg-blue-600';

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-60'} transition-all duration-300 ease-in-out bg-[#0d1117] border-r border-white/5 h-screen sticky top-0 flex flex-col flex-shrink-0`}>

      {/* Logo bar */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 ${accent} rounded-lg flex items-center justify-center shadow-lg`}>
              <Plane size={14} className="text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">TravelApp</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5 ml-auto">
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* User badge */}
      <div className={`mx-2 mt-4 mb-1 bg-white/5 rounded-xl flex items-center gap-3 ${collapsed ? 'justify-center p-2' : 'px-3 py-3'}`}>
        <div className={`w-8 h-8 rounded-full ${accent} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className={`text-xs capitalize ${roleColor[user?.role] || 'text-gray-400'}`}>{user?.role}</p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
               ${isActive ? `${accent} text-white shadow-lg` : 'text-gray-500 hover:text-white hover:bg-white/5'}`
            }>
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-white/5">
        <button onClick={logout} title={collapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
