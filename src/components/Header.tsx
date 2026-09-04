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
    setSoundEnabled
  } = useApp();

  const myPendingOrActiveOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'in_service');

  const handleModeSwitch = (targetMode: 'customer' | 'admin') => {
    playClickSound();
    setMode(targetMode);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#05070b]/85 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => {
            if (mode === 'customer') {
              playClickSound();
              setCustomerView('home');
            }
          }}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#9FB5C3] via-[#7B95A7] to-[#4D6575] p-[1px] shadow-[0_0_20px_rgba(159,181,195,0.25)] group-hover:shadow-[0_0_25px_rgba(159,181,195,0.4)] transition-all">
            <div className="w-full h-full bg-[#0b0f17] rounded-[15px] flex items-center justify-center overflow-hidden">
              <span className="font-serif-luxury font-bold text-lg sm:text-xl text-white tracking-tighter">
                參
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury font-bold tracking-widest text-base sm:text-lg text-white group-hover:text-blue-200 transition-colors">
                三月森夜
              </span>
              <span className="text-[10px] tracking-[0.2em] font-sans uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                Lounge
              </span>
            </div>
            <span className="text-[10px] tracking-[0.25em] text-[#9cb7d1]/80 font-sans uppercase">
              MARCH NIGHT
            </span>
          </div>
        </div>

        {/* Center Nav / Status Pill */}
        {mode === 'customer' ? (
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                playClickSound();
                setCustomerView('home');
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                customerView === 'home'
                  ? 'bg-white/10 text-white shadow-inner border border-white/15'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              點單首頁
            </button>
            <button
              onClick={() => {
                playClickSound();
                setCustomerView('orders_status');
              }}
              className={`relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                customerView === 'orders_status'
                  ? 'bg-blue-600/30 text-blue-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-blue-300" />
              <span>我的點單進度</span>
              {myPendingOrActiveOrders.length > 0 && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
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

          {/* View Switcher: Shown ONLY when already in Admin Mode */}
          {mode === 'admin' && (
            <button
              onClick={() => handleModeSwitch('customer')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] shadow-[0_0_15px_rgba(159,181,195,0.35)] transition-all cursor-pointer"
              id="switch-to-customer-mode"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>返回前台點餐</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
