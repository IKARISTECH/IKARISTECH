import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children, roles = [] }) {
  const token   = useAuthStore((s) => s.token);
  const usuario = useAuthStore((s) => s.usuario);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && usuario && !roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}