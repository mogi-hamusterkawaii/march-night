import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Utensils, Volume2, VolumeX, Bell, Sparkles, MapPin } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const Header: React.FC = () => {
  const {
    mode,
    setMode,
    customerView,
    setCustomerView,
    myOrders,
    guestLocation,
    soundEnabled,
    setSoundEnabled,
    isAdmin
  } = useApp();

  const myPendingOrActiveOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'in_service');

  const handleModeSwitch = (targetMode: 'customer' | 'admin') => {
    playClickSound();
    setMode(targetMode);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#05070b]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Tag */}
        <div 
          onClick={() => {
            if (mode === 'customer') setCustomerView('home');
          }}
          className="flex items-center gap-3.5 cursor-pointer group"
          id="app-brand-logo"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-[#486581] p-[1px] shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#05070b] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-luxury text-lg tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#9cb7d1] group-hover:text-blue-300 transition-colors font-bold">
                三月森夜
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-600/15 text-[#9cb7d1] border border-blue-500/30 font-bold tracking-widest uppercase">
                VIP
              </span>
            </div>
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/40 mt-0.5">MARCH NIGHT • FLAIR & CHEKI</p>
          </div>
        </div>

        {/* Center / Navigation Shortcuts - Only 服務首頁 & 訂單進度 */}
        {mode === 'customer' ? (
          <nav className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => { playClickSound(); setCustomerView('home'); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                customerView === 'home'
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              id="nav-customer-home"
            >
              服務首頁
            </button>
            <button
              onClick={() => { playClickSound(); setCustomerView('orders_status'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                customerView === 'orders_status'
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              id="nav-customer-status"
            >
              <Bell className="w-3.5 h-3.5 text-blue-300" />
              訂單進度
              {myPendingOrActiveOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white font-black text-[10px] flex items-center justify-center shadow-sm">
                  {myPendingOrActiveOrders.length}
                </span>
              )}
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-[#9cb7d1] font-medium bg-blue-600/10 border border-blue-500/25 px-4 py-2 rounded-xl backdrop-blur-md">
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span className="tracking-wide">管理後台模式（即時訂單調度 / 店員排班 / 菜單與定價）</span>
          </div>
        )}

        {/* Right Utility Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Location Badge (Customer Mode) */}
          {mode === 'customer' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white/80 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-[#9cb7d1]" />
              <span className="truncate max-w-[140px] font-medium tracking-wide">{guestLocation}</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all"
            title={soundEnabled ? '音效開啟 (點擊關閉)' : '音效已靜音 (點擊開啟)'}
            id="btn-toggle-sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-300" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          {/* View Switcher: Shown when already authenticated Admin */}
          {mode === 'admin' ? (
            <button
              onClick={() => handleModeSwitch('customer')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] shadow-[0_0_15px_rgba(159,181,195,0.35)] transition-all cursor-pointer"
              id="switch-to-customer-mode"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>返回前台點餐</span>
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={() => handleModeSwitch('admin')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide bg-blue-600/30 hover:bg-blue-600/45 text-blue-200 border border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
                id="switch-to-admin-mode"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>返回管理後台</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
