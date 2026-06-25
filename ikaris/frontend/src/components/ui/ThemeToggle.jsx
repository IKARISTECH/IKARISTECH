import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { Icons } from './Icons';

export default function ThemeToggle() {
  const isDark = useThemeStore((s) => s.isDark);
  const toggle = useThemeStore((s) => s.toggle);

  const handleClick = () => {
    toggle();
    // Debug temporal — puedes quitarlo después
    console.log('[IKARIS Theme] isDark ahora:', !isDark);
    console.log('[IKARIS Theme] clases en html:', document.documentElement.className);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            className="absolute text-slate-300"
            initial={{ y: 32,  opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: -32, opacity: 0 }}
            transition={{
  type: 'spring',
  stiffness: 1200,
  damping: 60
}}
          >
            <Icons.moon className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            className="absolute text-amber-500"
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 32,  opacity: 0 }}
            transition={{
  type: 'spring',
  stiffness: 1200,
  damping: 60
}}
          >
            <Icons.sun className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}