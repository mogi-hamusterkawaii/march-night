/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { NotificationToast } from './components/NotificationToast';
import { HomeSelection } from './components/customer/HomeSelection';
import { FlairBartendingOrderView } from './components/customer/FlairBartendingOrderView';
import { ChekiPhotoOrderView } from './components/customer/ChekiPhotoOrderView';
import { CustomerOrderStatusView } from './components/customer/CustomerOrderStatusView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from './utils/audio';

const MainContent: React.FC = () => {
  const { mode, setMode, customerView } = useApp();
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const handleOpenAdminLogin = () => {
    playClickSound();
    setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoginOpen(false);
    setMode('admin');
  };

  return (
    <div className="min-h-screen bg-[#05070b] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation Bar */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {mode === 'customer' ? (
            <motion.div
              key={`customer-${customerView}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {customerView === 'home' && <HomeSelection />}
              {customerView === 'bartending' && <FlairBartendingOrderView />}
              {customerView === 'cheki' && <ChekiPhotoOrderView />}
              {customerView === 'orders_status' && <CustomerOrderStatusView />}
            </motion.div>
          ) : (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating System Notifications */}
      <NotificationToast />

      {/* Secret Password Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Footer with Inconspicuous Secret Admin Entrance */}
      <footer className="border-t border-white/10 bg-[#05070b] py-6 text-center text-xs text-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-white/80">三月森夜 MARCH NIGHT • 花式調酒 & 拍立得點餐管理系統</span>
          <div className="flex items-center gap-1 text-[11px] text-[#9cb7d1]/70">
            <span>© 2026 三月森夜 MARCH NIGHT. All rights reserved.</span>
            {/* Inconspicuous Secret Trigger */}
            <button
              onClick={handleOpenAdminLogin}
              className="opacity-20 hover:opacity-90 hover:text-blue-300 transition-all p-1 text-[11px] cursor-pointer rounded"
              title="·"
              id="secret-admin-trigger"
            >
              ❖
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
