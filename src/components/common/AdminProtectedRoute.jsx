import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function AdminProtectedRoute({ children }) {
  const { user, userProfile, role, loading, adminMode } = useAuth();

  if (loading) return <Loader />;

  // Allow access if admin mode is active or if user has admin role and email matches
  const isAdminAuthed = adminMode || (userProfile?.role === 'admin' && user?.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase());

  if (!isAdminAuthed) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
