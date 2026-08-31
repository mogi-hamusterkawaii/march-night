import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationToast: React.FC = () => {
  const { notifications, dismissNotification, setMode, setCustomerView } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-start justify-between gap-3 text-xs ${
              notif.type === 'order_new'
                ? 'bg-neutral-900/95 border-amber-500/40 text-neutral-100 shadow-amber-500/10'
                : notif.type === 'order_update'
                ? 'bg-neutral-900/95 border-purple-500/40 text-neutral-100 shadow-purple-500/10'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
            }`}
            id={`toast-${notif.id}`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                notif.type === 'order_new' 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : notif.type === 'order_update' 
                  ? 'bg-purple-500/20 text-purple-400' 
                  : 'bg-neutral-800 text-neutral-400'
              }`}>
                {notif.type === 'order_new' ? (
                  <Sparkles className="w-4 h-4" />
                ) : notif.type === 'order_update' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs leading-snug">{notif.title}</h4>
                <p className="text-neutral-300 text-[11px] mt-0.5 leading-relaxed">{notif.message}</p>
                {notif.orderId && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => {
                        dismissNotification(notif.id);
                        setMode('customer');
                        setCustomerView('orders_status');
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
                    >
                      查看訂單狀態 &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="text-neutral-500 hover:text-neutral-300 p-1 rounded-md transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
