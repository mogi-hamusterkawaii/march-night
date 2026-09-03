import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wine, Users, MapPin, Star, Flame, Sparkles, Plus, Minus,
  ArrowLeft, CheckCircle, ShieldCheck, HeartHandshake, Info, Dices 
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';

export const FlairBartendingOrderView: React.FC = () => {
  const {
    setCustomerView,
    staffList,
    tables,
    guestLocation,
    setGuestLocation,
    guestName,
    setGuestName,
    addFlairOrder,
    preselectedStaffId,
    setPreselectedStaffId,
    setLastPlacedOrder
  } = useApp();

  // Primary Required Fields
  const [guestCount, setGuestCount] = useState<number>(2);
  const [location, setLocation] = useState<string>(() => {
    if (guestLocation && (guestLocation.includes('B1') || guestLocation.includes('2F'))) {
      return guestLocation;
    }
    return '1. B1酒吧';
  });
  const [customLocationNotes, setCustomLocationNotes] = useState<string>('');
  
  // On-duty staff list
  const onDutyStaffList = staffList.filter(s => s.status === 'on_duty');

  // Center Staff Selection
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    if (preselectedStaffId) {
      const isPresetOnDuty = staffList.some(s => s.id === preselectedStaffId && s.status === 'on_duty');
      if (isPresetOnDuty) return preselectedStaffId;
    }
    const available = staffList.find(s => s.status === 'on_duty' && s.centerAvailability);
    return available ? available.id : (onDutyStaffList[0]?.id || 'random');
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedStaffId) {
      const isPresetOnDuty = staffList.some(s => s.id === preselectedStaffId && s.status === 'on_duty');
      if (isPresetOnDuty) {
        setSelectedStaffId(preselectedStaffId);
      }
      setPreselectedStaffId(null);
    }
  }, [preselectedStaffId, setPreselectedStaffId, staffList]);

  // Keep location synced
  useEffect(() => {
    setGuestLocation(location);
  }, [location, setGuestLocation]);

  const isRandomSelected = selectedStaffId === 'random';
  const selectedStaff = isRandomSelected ? null : staffList.find(s => s.id === selectedStaffId);

  // Calculate totals
  const totalAmount = 400000; // 400,000 Gil Base Flair Show fee

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!location.trim()) {
      setValidationError('請填寫或選擇您的所在位置/桌號');
      return;
    }
    if (guestCount < 1) {
      setValidationError('客人人數需至少為 1 位');
      return;
    }
    if (!selectedStaffId) {
      setValidationError('請選擇一位您想要的C位店員');
      return;
    }
    if (!isRandomSelected && !selectedStaff) {
      setValidationError('請選擇一位您想要的C位店員');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    const fullLocation = customLocationNotes 
      ? `${location} (${customLocationNotes})` 
      : location;

    const centerStaffId = isRandomSelected ? 'random' : selectedStaff!.id;
    const centerStaffName = isRandomSelected ? '🎲 隨機一位店員 (現場抽選)' : `${selectedStaff!.name} (${selectedStaff!.nickname})`;
    const centerStaffAvatar = isRandomSelected 
      ? 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80' 
      : selectedStaff!.avatar;

    try {
      const newOrder = await addFlairOrder({
        guestCount,
        location: fullLocation,
        centerStaffId,
        centerStaffName,
        centerStaffAvatar,
        flairTheme: '花式調酒',
        cocktails: [],
        guestName: guestName.trim() || 'VIP貴賓',
        specialRequests: isRandomSelected ? '【指定C位：隨機一位店員】' : '',
        totalAmount
      });

      setLastPlacedOrder(newOrder);
      setCustomerView('orders_status');
    } catch (err) {
      console.error('Error submitting flair order:', err);
      setValidationError('送出訂單時發生問題，請再試一次');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Back Button & Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <button
          onClick={() => { playClickSound(); setCustomerView('home'); }}
          className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          id="btn-back-to-home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-[#9cb7d1] text-[10px] font-bold tracking-widest uppercase">
              VIP FLAIR EXPERIENCE
            </span>
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white mt-1">
            花式調酒專屬點單
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        
        {/* Requirement 1 & 2: 客人有幾位 & 客人所在位置 */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/10">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-serif-luxury text-lg font-bold text-white">1. 入座人數與所在位置資訊</h2>
            <span className="text-xs text-[#9cb7d1] font-medium">* 必填項目</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Guest Count */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-2">
                客人家位/同行人數 (有幾位) <span className="text-blue-400">*</span>
              </label>
              <div className="flex items-center gap-3 bg-[#0b0f17] border border-white/10 p-2.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setGuestCount(Math.max(1, guestCount - 1)); }}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white flex items-center justify-center font-bold border border-white/10 transition-all cursor-pointer"
                  id="btn-decrease-guests"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-blue-400">{guestCount}</span>
                  <span className="text-xs text-[#9cb7d1] ml-1.5 font-medium">位貴賓</span>
                </div>

                <button
                  type="button"
                  onClick={() => { playClickSound(); setGuestCount(guestCount + 1); }}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white flex items-center justify-center font-bold border border-white/10 transition-all cursor-pointer"
                  id="btn-increase-guests"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Guest Count Pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[1, 2, 4, 6, 8, 10].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => { playClickSound(); setGuestCount(count); }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      guestCount === count
                        ? 'bg-[#9FB5C3] text-[#0b0f17] font-black shadow-[0_0_15px_rgba(159,181,195,0.35)]'
                        : 'bg-[#0b0f17] text-white/60 border border-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {count} 位
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Location */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-2">
                所在區域 (選擇區域) <span className="text-blue-400">*</span>
              </label>
              
              {/* 2 Area Option Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                {[
                  { label: '1. B1酒吧', desc: 'B1 吧檯與主酒吧區' },
                  { label: '2. 2F休息區', desc: '2F 沙發與專屬休息區' }
                ].map(areaOpt => (
                  <button
                    key={areaOpt.label}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setLocation(areaOpt.label);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      location.includes(areaOpt.label) || location === areaOpt.label
                        ? 'bg-blue-600/20 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                        : 'bg-[#0b0f17] border-white/10 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
                      <span>{areaOpt.label}</span>
                      {(location.includes(areaOpt.label) || location === areaOpt.label) && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#9cb7d1] mt-1">{areaOpt.desc}</div>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="桌位補充說明（如：靠吧檯中央、2F沙發靠窗等，選填）"
                value={customLocationNotes}
                onChange={(e) => setCustomLocationNotes(e.target.value)}
                className="w-full bg-[#0b0f17] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white/90 placeholder-white/30 focus:outline-none focus:border-blue-400/70"
              />
            </div>
          </div>

          {/* Guest Name / Character ID input */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <label className="block text-xs font-semibold text-white/80 mb-2">
              角色ID (選填，方便店員桌邊互動稱呼)
            </label>
            <input
              type="text"
              placeholder="例如：Cloud_Strife、Jessica、夜神月"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-[#0b0f17] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-blue-400/70"
              id="input-flair-guest-name"
            />
          </div>
        </div>

        {/* Requirement 3: 想要的C位店員 (Desired Center Staff) */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Star className="w-5 h-5 text-blue-400 fill-blue-400" />
              <h2 className="font-serif-luxury text-lg font-bold text-white">2. 選擇您想要的 C 位店員</h2>
              <span className="text-xs text-[#9cb7d1] font-medium">* 必選項目</span>
            </div>
            <span className="text-xs text-white/50">
              由所選C位店員為您呈現專屬花式調酒
            </span>
          </div>

          {/* Staff Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Special Option: 隨機一位店員 */}
            <div
              key="random-staff"
              onClick={() => {
                playClickSound();
                setSelectedStaffId('random');
              }}
              className={`relative rounded-3xl p-5 transition-all border flex flex-col justify-between cursor-pointer ${
                isRandomSelected
                  ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.25)]'
                  : 'bg-[#0b0f17] border-white/10 hover:border-white/20'
              }`}
              id="card-staff-random"
            >
              {/* Selected Center Badge */}
              {isRandomSelected && (
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  已指定為 C 位
                </div>
              )}

              <div>
                <div className="flex items-start gap-3.5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-300 shadow-md">
                      <Dices className="w-8 h-8" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b0f17] bg-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-base truncate">隨機一位店員</span>
                    </div>
                    <div className="text-xs text-[#9cb7d1] font-medium truncate mt-0.5">現場隨機安排</div>
                  </div>
                </div>

                {/* Specialty callout */}
                <div className="mt-3.5 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 text-xs">
                  <div className="text-[#9cb7d1] font-semibold flex items-center gap-1 text-[11px]">
                    <Flame className="w-3 h-3 text-blue-400" />
                    C位拿手專長:
                  </div>
                  <p className="text-white/80 text-[11px] mt-0.5 line-clamp-2">
                    由今晚在班店員中隨機指派一位擔當 C 位表演，帶來驚喜互動與專屬演出！
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-blue-300 font-medium">
                  🔵 現場隨機指派
                </span>
                <button
                  type="button"
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    isRandomSelected
                      ? 'bg-[#9FB5C3] text-[#0b0f17] shadow-sm font-extrabold'
                      : 'bg-white/[0.05] hover:bg-white/10 text-white/80 border border-white/10'
                  }`}
                >
                  {isRandomSelected ? '✓ 目前C位' : '選擇為C位'}
                </button>
              </div>
            </div>

            {/* Existing On-Duty Staff */}
            {onDutyStaffList.map(staff => {
              const isSelected = selectedStaffId === staff.id;

              return (
                <div
                  key={staff.id}
                  onClick={() => {
                    playClickSound();
                    setSelectedStaffId(staff.id);
                  }}
                  className={`relative rounded-3xl p-5 transition-all border flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.25)]'
                      : 'bg-[#0b0f17] border-white/10 hover:border-white/20'
                  }`}
                  id={`card-staff-${staff.id}`}
                >
                  {/* Selected Center Badge */}
                  {isSelected && (
                    <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" />
                      已指定為 C 位
                    </div>
                  )}

                  <div>
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b0f17] bg-blue-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-base truncate">{staff.name}</span>
                          <span className="text-xs text-white/50 truncate">({staff.nickname})</span>
                        </div>
                        <div className="text-xs text-[#9cb7d1] font-medium truncate mt-0.5">{staff.title}</div>
                      </div>
                    </div>

                    {/* Specialty callout */}
                    <div className="mt-3.5 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 text-xs">
                      <div className="text-[#9cb7d1] font-semibold flex items-center gap-1 text-[11px]">
                        <Flame className="w-3 h-3 text-blue-400" />
                        C位拿手專長:
                      </div>
                      <p className="text-white/80 text-[11px] mt-0.5 line-clamp-2">
                        {staff.flairSpecialty}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-blue-300 font-medium">
                      🔵 在班可指定
                    </span>
                    <button
                      type="button"
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#9FB5C3] text-[#0b0f17] shadow-sm font-extrabold'
                          : 'bg-white/[0.05] hover:bg-white/10 text-white/80 border border-white/10'
                      }`}
                    >
                      {isSelected ? '✓ 目前C位' : '選擇為C位'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation error banner */}
        {validationError && (
          <div className="bg-blue-900/30 border border-blue-500/50 text-[#9cb7d1] px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Order Summary & Submit Bar */}
        <div className="bg-white/[0.04] backdrop-blur-xl border-2 border-blue-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="text-xs text-white/60 font-medium">
              {location} • 共 {guestCount} 位 • 指定 C 位：
              <span className="text-blue-300 font-bold ml-1">
                {isRandomSelected ? '🎲 隨機一位店員 (現場安排)' : selectedStaff?.name}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs text-[#9cb7d1]">專屬 C 位花式調酒費</span>
              <span className="font-serif-luxury text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">{totalAmount.toLocaleString()} Gil</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { playClickSound(); setCustomerView('home'); }}
              className="px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            >
              取消返回
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] font-black text-sm shadow-[0_0_30px_rgba(159,181,195,0.35)] transition-all cursor-pointer"
              id="btn-submit-flair-order"
            >
              <Wine className="w-4 h-4" />
              <span>確認送出花式調酒點單 ({totalAmount.toLocaleString()} Gil)</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
