import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wine, Camera, Sparkles, Flame, Heart, ChevronRight, Clock, MapPin } from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { motion } from 'motion/react';

export const HomeSelection: React.FC = () => {
  const { 
    setCustomerView, 
    guestLocation, 
    setGuestLocation, 
    myOrders 
  } = useApp();

  const myActiveOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'in_service');

  const handleSelectService = (view: 'bartending' | 'cheki') => {
    playClickSound();
    setCustomerView(view);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
      
      {/* Background ambient lighting effects */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#5c7c99]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Location & Greeting Bar */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 mb-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-300 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9cb7d1] font-bold">目前所在區域</div>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={guestLocation}
                onChange={(e) => setGuestLocation(e.target.value)}
                className="bg-[#0b0f17] text-white font-semibold text-sm rounded-xl px-3.5 py-1.5 border border-white/15 focus:outline-none focus:border-blue-400 transition-all cursor-pointer"
                id="select-home-location"
              >
                <option value="1. B1酒吧">1. B1酒吧</option>
                <option value="2. 2F休息區">2. 2F休息區</option>
              </select>
            </div>
          </div>
        </div>

        {myActiveOrders.length > 0 && (
          <button
            onClick={() => { playClickSound(); setCustomerView('orders_status'); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-white px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] group"
            id="btn-home-active-orders"
          >
            <Clock className="w-4 h-4 text-blue-300 group-hover:rotate-12 transition-transform" />
            <span>您有 {myActiveOrders.length} 筆進行中的訂單進度</span>
            <ChevronRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Title Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-[#9cb7d1] text-xs font-semibold tracking-widest uppercase mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>MARCH NIGHT VIP EXPERIENCE</span>
        </div>
        <h1 className="font-serif-luxury text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-[#9cb7d1] tracking-tight leading-tight">
          請選擇您專屬的三月森夜服務
        </h1>
        <p className="text-white/70 text-sm sm:text-base mt-3 leading-relaxed font-light">
          即刻指定心儀 C 位店員，享受震撼花式調酒秀，或拍立得留念合影。
        </p>
      </div>

      {/* 2 Primary Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Service 1: 花式調酒 (Royal Blue Theme) */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.25 }}
          onClick={() => handleSelectService('bartending')}
          className="relative bg-white/[0.03] hover:bg-white/[0.05] border border-blue-500/30 hover:border-blue-400 rounded-3xl p-6 sm:p-8 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(37,99,235,0.25)] transition-all flex flex-col justify-between group overflow-hidden backdrop-blur-xl"
          id="card-service-flair-bartending"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <Flame className="w-7 h-7" />
              </div>
            </div>

            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-200 transition-colors flex items-center gap-2.5">
              花式調酒
              <Wine className="w-5 h-5 text-blue-400" />
            </h2>

            <p className="text-white/70 text-sm mt-3.5 leading-relaxed font-light">
              桌邊近距離享受空中高難度拋接與魔幻調色視覺秀！自訂同行人數與座位，並指定您最鍾愛的<span className="text-blue-300 font-semibold">C位店員</span>親臨演出。
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-blue-300 font-bold text-xs">客製人數</div>
                <div className="text-[10px] text-white/50 mt-0.5">人數與桌位點選</div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-blue-300 font-bold text-xs">指定C位</div>
                <div className="text-[10px] text-white/50 mt-0.5">專屬調酒師出秀</div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-blue-300 font-bold text-xs">專屬演出</div>
                <div className="text-[10px] text-white/50 mt-0.5">專屬近距離互動</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium tracking-wide">填寫人數 • 位置 • 指定C位</span>
            <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs tracking-wider uppercase group-hover:translate-x-1 transition-transform">
              <span>前往花式調酒點單</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Service 2: 攝影服務 (Morandi Blue Theme) */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.25 }}
          onClick={() => handleSelectService('cheki')}
          className="relative bg-white/[0.03] hover:bg-white/[0.05] border border-[#6e8ca6]/40 hover:border-[#9cb7d1] rounded-3xl p-6 sm:p-8 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_40px_rgba(110,140,166,0.25)] transition-all flex flex-col justify-between group overflow-hidden backdrop-blur-xl"
          id="card-service-cheki-photo"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5c7c99]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#5c7c99]/25 transition-all" />

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#5c7c99]/20 border border-[#6e8ca6]/40 flex items-center justify-center text-[#9cb7d1] group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(110,140,166,0.25)]">
                <Camera className="w-7 h-7" />
              </div>
            </div>

            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white group-hover:text-[#9cb7d1] transition-colors flex items-center gap-2.5">
              攝影服務 (拍立得)
              <Heart className="w-5 h-5 text-[#9cb7d1]" />
            </h2>

            <p className="text-white/70 text-sm mt-3.5 leading-relaxed font-light">
              先選擇想合照的店員，為您提供多樣化拍立得服務：包含<span className="text-[#9cb7d1] font-semibold">拍立得(無簽)</span>、<span className="text-[#9cb7d1] font-semibold">拍立得(有簽)</span>以及極具珍藏價值的<span className="text-[#9cb7d1] font-semibold">拍立得(簽繪)</span>！
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-[#9cb7d1] font-bold text-xs">拍立得 (無簽)</div>
                <div className="text-[10px] text-white/50 mt-0.5">經典合照留念</div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-[#9cb7d1] font-bold text-xs">拍立得 (有簽)</div>
                <div className="text-[10px] text-white/50 mt-0.5">親筆署名寄語</div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-[#9cb7d1] font-bold text-xs">拍立得 (簽繪)</div>
                <div className="text-[10px] text-white/50 mt-0.5">專屬手繪彩繪</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-white/50 font-medium tracking-wide">先選店員 • 再選服務類型</span>
            <div className="flex items-center gap-1.5 text-[#9cb7d1] font-bold text-xs tracking-wider uppercase group-hover:translate-x-1 transition-transform">
              <span>挑選店員與拍照服務</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
