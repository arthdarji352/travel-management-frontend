import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';

// Admin
import AdminDashboard     from './pages/admin/Dashboard.jsx';
import UserManagement     from './pages/admin/UserManagement.jsx';
import AdminTravelList    from './pages/admin/TravelList.jsx';
import AdminFinanceView   from './pages/admin/FinanceView.jsx';
import AdminNotifications from './pages/admin/Notifications.jsx';

// Employee
import EmployeeDashboard     from './pages/employee/Dashboard.jsx';
import TravelManage          from './pages/employee/TravelManage.jsx';
import EmployeeProfile       from './pages/employee/Profile.jsx';
import TravelDetail          from './pages/employee/TravelDetail.jsx';
import EmployeeNotifications from './pages/employee/Notifications.jsx';

// Manager
import ManagerDashboard      from './pages/manager/Dashboard.jsx';
import TravelApprovals       from './pages/manager/TravelApprovals.jsx';
import AdvanceApprovals      from './pages/manager/AdvanceApprovals.jsx';
import ManagerProfile        from './pages/manager/Profile.jsx';
import ManagerMyTravels      from './pages/manager/MyTravels.jsx';
import ManagerMyTravelDetail from './pages/manager/MyTravelDetail.jsx';
import ManagerNotifications  from './pages/manager/Notifications.jsx';

// HR
import HRDashboard        from './pages/hr/Dashboard.jsx';
import HRTravelApprovals  from './pages/hr/TravelApprovals.jsx';
import HRAdvanceApprovals from './pages/hr/AdvanceApprovals.jsx';
import BookTravel         from './pages/hr/BookTravel.jsx';
import AllTravels         from './pages/hr/AllTravels.jsx';
import HRProfile          from './pages/hr/Profile.jsx';
import HRNotifications    from './pages/hr/Notifications.jsx';

// Finance
import FinanceDashboard      from './pages/finance/Dashboard.jsx';
import FinanceDisbursements  from './pages/finance/Disbursements.jsx';
import FinanceReimbursements from './pages/finance/Reimbursements.jsx';
import FinanceLedger         from './pages/finance/Ledger.jsx';
import FinanceProfile        from './pages/finance/Profile.jsx';

// Shared
import FinanceOverview from './pages/shared/FinanceOverview.jsx';

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-gray-950">
    <Sidebar />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
);

const PR = ({ roles, children }) => (
  <ProtectedRoute roles={roles}><Layout>{children}</Layout></ProtectedRoute>
);

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Login />} />

    {/* Admin */}
    <Route path="/admin/dashboard"        element={<PR roles={['admin']}><AdminDashboard     /></PR>} />
    <Route path="/admin/users"            element={<PR roles={['admin']}><UserManagement     /></PR>} />
    <Route path="/admin/travels"          element={<PR roles={['admin']}><AdminTravelList    /></PR>} />
    <Route path="/admin/finance"          element={<PR roles={['admin']}><AdminFinanceView   /></PR>} />
    <Route path="/admin/notifications"    element={<PR roles={['admin']}><AdminNotifications /></PR>} />

    {/* Employee */}
    <Route path="/employee/dashboard"     element={<PR roles={['employee']}><EmployeeDashboard     /></PR>} />
    <Route path="/employee/travels"       element={<PR roles={['employee']}><TravelManage           /></PR>} />
    <Route path="/employee/travels/:id"   element={<PR roles={['employee']}><TravelDetail           /></PR>} />
    <Route path="/employee/profile"       element={<PR roles={['employee']}><EmployeeProfile        /></PR>} />
    <Route path="/employee/notifications" element={<PR roles={['employee']}><EmployeeNotifications  /></PR>} />

    {/* Manager */}
    <Route path="/manager/dashboard"        element={<PR roles={['manager']}><ManagerDashboard      /></PR>} />
    <Route path="/manager/travels"          element={<PR roles={['manager']}><TravelApprovals       /></PR>} />
    <Route path="/manager/advances"         element={<PR roles={['manager']}><AdvanceApprovals      /></PR>} />
    <Route path="/manager/my-travels"       element={<PR roles={['manager']}><ManagerMyTravels      /></PR>} />
    <Route path="/manager/my-travels/:id"   element={<PR roles={['manager']}><ManagerMyTravelDetail /></PR>} />
    <Route path="/manager/finance"          element={<PR roles={['manager']}><FinanceOverview       /></PR>} />
    <Route path="/manager/profile"          element={<PR roles={['manager']}><ManagerProfile        /></PR>} />
    <Route path="/manager/notifications"    element={<PR roles={['manager']}><ManagerNotifications  /></PR>} />

    {/* HR */}
    <Route path="/hr/dashboard"             element={<PR roles={['hr']}><HRDashboard        /></PR>} />
    <Route path="/hr/travel-approvals"      element={<PR roles={['hr']}><HRTravelApprovals  /></PR>} />
    <Route path="/hr/advance-approvals"     element={<PR roles={['hr']}><HRAdvanceApprovals /></PR>} />
    <Route path="/hr/book"                  element={<PR roles={['hr']}><BookTravel         /></PR>} />
    <Route path="/hr/travels"               element={<PR roles={['hr']}><AllTravels         /></PR>} />
    <Route path="/hr/profile"               element={<PR roles={['hr']}><HRProfile         /></PR>} />
    <Route path="/hr/notifications"         element={<PR roles={['hr']}><HRNotifications   /></PR>} />

    {/* Finance */}
    <Route path="/finance/dashboard"        element={<PR roles={['finance']}><FinanceDashboard      /></PR>} />
    <Route path="/finance/disbursements"    element={<PR roles={['finance']}><FinanceDisbursements  /></PR>} />
    <Route path="/finance/reimbursements"   element={<PR roles={['finance']}><FinanceReimbursements /></PR>} />
    <Route path="/finance/ledger"           element={<PR roles={['finance']}><FinanceLedger         /></PR>} />
    <Route path="/finance/profile"          element={<PR roles={['finance']}><FinanceProfile        /></PR>} />

    {/* Fallback */}
    <Route path="/"  element={<Navigate to="/login" replace />} />
    <Route path="*"  element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
