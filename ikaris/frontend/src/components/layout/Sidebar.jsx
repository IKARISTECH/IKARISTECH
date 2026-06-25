import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '../ui/Icons';

const NAV_ITEMS = [
  { to: '/dashboard',   Icon: Icons.home,     label: 'Inicio' },
  { to: '/clientes',    Icon: Icons.clients,  label: 'Clientes' },
  { to: '/facturacion', Icon: Icons.invoice,  label: 'Facturas' },
  { to: '/compras',     Icon: Icons.cart,     label: 'Compras' },
  { to: '/inventario',  Icon: Icons.box,      label: 'Inventario' },
  { to: '/tareas',      Icon: Icons.check,    label: 'Tareas' },
  { to: '/calendario',  Icon: Icons.calendar, label: 'Calendario' },
  { to: '/reuniones',   Icon: Icons.video,    label: 'Reuniones' },
  { to: '/formularios', Icon: Icons.form,     label: 'Formularios' },
  { to: '/rh',          Icon: Icons.people,   label: 'RH' },
  { to: '/reportes',    Icon: Icons.chart,    label: 'Reportes' },
];

export default function Sidebar() {
  return (
    <aside className="
      h-screen w-[72px] shrink-0
      bg-white dark:bg-[#0f0f13]
      border-r border-gray-200 dark:border-white/5
      flex flex-col items-center
      py-4 gap-1
      z-30
    ">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl overflow-hidden mb-3 shrink-0">
        <img
          src="/assets/IKON.png"
          alt="IKARIS"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 w-full px-2 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) => `
              relative w-full flex flex-col items-center justify-center
              gap-0.5 py-2 rounded-xl cursor-pointer select-none
              transition-all duration-150
              ${isActive
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl bg-violet-100 dark:bg-violet-600/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="relative z-10 text-[9px] font-medium leading-none">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Campana abajo */}
      <div className="flex flex-col items-center gap-2 mt-2 pb-1">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white transition-colors"
          title="Notificaciones"
        >
          <Icons.bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0f0f13]" />
        </motion.button>
      </div>
    </aside>
  );
}