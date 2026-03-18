import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const dashboardByRole = {
  admin:    '/admin/dashboard',
  employee: '/employee/dashboard',
  manager:  '/manager/dashboard',
  hr:       '/hr/dashboard',
  finance:  '/finance/dashboard',
};

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardByRole[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
