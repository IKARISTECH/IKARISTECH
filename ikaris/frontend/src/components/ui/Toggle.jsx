import { motion } from 'framer-motion';

export default function Toggle({ active, onChange, label }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onChange(!active); }}
      className="flex items-center gap-3 group focus:outline-none"
      aria-label={label}
    >
      {/* Track */}
      <div className={`
        relative w-12 h-6 rounded-full transition-all duration-300
        ${active
          ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-md shadow-blue-400/40'
          : 'bg-gray-200 dark:bg-gray-700'
        }
      `}>
        {/* Thumb */}
        <motion.div
          animate={{ x: active ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            absolute top-1 w-4 h-4 rounded-full shadow-md
            flex items-center justify-center
            ${active ? 'bg-white' : 'bg-white dark:bg-gray-300'}
          `}
        >
          {/* Brillo interior */}
          <div className={`
            w-2.5 h-2.5 rounded-full transition-all duration-300
            ${active
              ? 'bg-blue-200 opacity-60'
              : 'bg-gray-100 opacity-40'
            }
          `} />
        </motion.div>
      </div>

      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400 select-none group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
          {label}
        </span>
      )}
    </button>
  );
}