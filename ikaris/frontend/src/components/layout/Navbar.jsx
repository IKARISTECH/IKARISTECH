import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';
import ProfileDropdown from './ProfileDropdown';
import { Icons } from '../ui/Icons';
import { useAuthStore } from '../../store/authStore';

const NAV_ACTIONS = [
  { icon: Icons.settings, label: 'Configuración', to: '/configuracion' },
  { icon: Icons.plan,     label: 'Mi Plan',        to: '/plan' },
  { icon: Icons.users,    label: 'Usuarios',        to: '/usuarios' },
  { icon: Icons.shield,   label: 'Auditoría',       to: '/auditoria' },
];

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate  = useNavigate();
  const usuario   = useAuthStore((s) => s.usuario);
  const initials  = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <header className="
      h-14 shrink-0 px-5
      bg-white dark:bg-[#0f0f13]
      border-b border-gray-200 dark:border-white/5
      flex items-center gap-4
      z-20 relative
    ">
      {/* Buscador */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="
              w-full pl-9 pr-4 py-2 text-sm
              bg-gray-50 dark:bg-white/5
              border border-gray-200 dark:border-white/10
              rounded-xl text-gray-700 dark:text-gray-200
              placeholder-gray-400 dark:placeholder-gray-600
              focus:outline-none focus:ring-2 focus:ring-violet-500/60
              transition-all
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* 4 acciones rápidas */}
        {NAV_ACTIONS.map(({ icon: Icon, label, to }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate(to)}
            title={label}
            className="
              w-9 h-9 flex items-center justify-center rounded-xl
              text-gray-600 dark:text-gray-400
              hover:text-gray-950 dark:hover:text-white
              hover:bg-gray-100 dark:hover:bg-white/5
              transition-colors
            "
          >
            <Icon className="w-5 h-5" />
          </motion.button>
        ))}

        {/* Divisor */}
        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

        {/* Sol / Luna */}
        <ThemeToggle />

        {/* Avatar + dropdown */}
        <div className="relative ml-1">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setProfileOpen((v) => !v)}
            className="
              w-9 h-9 rounded-full
              bg-violet-600 hover:bg-violet-500
              flex items-center justify-center
              text-white font-semibold text-sm
              ring-2 ring-transparent hover:ring-violet-300 dark:hover:ring-violet-700
              transition-all overflow-hidden
            "
          >
            {usuario?.avatar_url
              ? <img src={usuario.avatar_url} className="w-full h-full object-cover" alt="" />
              : initials
            }
          </motion.button>

          {/* Dropdown — z-index alto para estar sobre todo */}
          <div className="relative z-[100]">
            <ProfileDropdown
              open={profileOpen}
              onClose={() => setProfileOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}