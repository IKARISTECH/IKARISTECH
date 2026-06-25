import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import IkarisAlert from '../alerts/IkarisAlert';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <motion.main
          className="flex-1 overflow-y-auto p-6 bg-stone-50 dark:bg-[#0a0a0f]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </div>
      <IkarisAlert />
    </div>
  );
}