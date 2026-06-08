import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'trivabsportsandevents@gmail.com';

export default function AdminProtectedRoute({ children }) {
  const { user, userProfile, role, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user || !userProfile || role !== 'admin' || userProfile.role !== 'admin' || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
