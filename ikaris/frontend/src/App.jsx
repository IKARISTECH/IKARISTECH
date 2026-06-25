import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { useAuthStore }  from './store/authStore';
import AppLayout         from './components/layout/AppLayout';
import ProtectedRoute    from './components/auth/ProtectedRoute';
import Dashboard         from './pages/dashboard/Dashboard';
import Tareas    from './pages/tareas/Tareas';
import Clientes          from './pages/clientes/Clientes';
import Usuarios          from './pages/usuarios/Usuarios';
import Calendario   from './pages/calendario/Calendario';
import Formularios  from './pages/formularios/Formularios';
import AceptarInvitacion from './pages/auth/AceptarInvitacion';
import Login             from './pages/auth/Login';
import Registro          from './pages/auth/Registro';

export default function App() {
  const init    = useThemeStore((s) => s.init);
  const token   = useAuthStore((s) => s.token);
  const usuario = useAuthStore((s) => s.usuario);
  const authed  = !!token && !!usuario;

  useEffect(() => { init(); }, []);

  return (
    <BrowserRouter>
      <Routes>
       <Route path="/login"              element={authed ? <Navigate to="/dashboard" replace /> : <Login />} />
       <Route path="/activar-cuenta"     element={<AceptarInvitacion />} />
        <Route path="/registro" element={authed ? <Navigate to="/dashboard" replace /> : <Registro />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tareas"    element={<Tareas />} />
          <Route path="/clientes"  element={<Clientes />} />
         <Route path="/usuarios"   element={<Usuarios />} />
          <Route path="/calendario"   element={<Calendario />} />
          <Route path="/formularios"  element={<Formularios />} />
          </Route>

        <Route path="*" element={<Navigate to={authed ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}