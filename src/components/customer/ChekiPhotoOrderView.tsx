import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Camera, Heart, Star, Sparkles, Plus, Minus, ArrowLeft, 
  MapPin, CheckCircle, UserCheck, Edit3, Image as ImageIcon, AlertCircle 
} from 'lucide-react';
import { playClickSound } from '../../utils/audio';
import { ChekiServiceType, Staff } from '../../types';

export const ChekiPhotoOrderView: React.FC = () => {
  const {
    setCustomerView,
    staffList,
    tables,
    guestLocation,
    setGuestLocation,
    guestName,
    setGuestName,
    addChekiOrder,
    preselectedStaffId,
    setPreselectedStaffId,
    setLastPlacedOrder
  } = useApp();

  // Filter only on-duty staff
  const onDutyStaffList = staffList.filter(s => s.status === 'on_duty');

  // Selected Staff state (Step 1: 先選擇想要的店員)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(() => {
    if (preselectedStaffId) {
      const found = staffList.find(s => s.id === preselectedStaffId && s.status === 'on_duty');
      if (found) return found;
    }
    const defaultDuty = staffList.find(s => s.status === 'on_duty');
    return defaultDuty || null;
  });

  // Step state: 'choose_staff' | 'choose_services'
  const [step, setStep] = useState<'choose_staff' | 'choose_services'>(() => {
    if (preselectedStaffId) {
      const isPresetOnDuty = staffList.some(s => s.id === preselectedStaffId && s.status === 'on_duty');
      if (isPresetOnDuty) return 'choose_services';
    }
    return 'choose_staff';
  });

  // Quantities for the 3 requested services
  const [quantities, setQuantities] = useState<Record<ChekiServiceType, number>>({
    without_sign: 1, // Default 1 regular cheki
    with_sign: 0,
    with_art_sign: 0
  });

  const [location, setLocation] = useState<string>(() => {
    if (guestLocation && (guestLocation.includes('B1') || guestLocation.includes('2F'))) {
      return guestLocation;
    }
    return '1. B1酒吧';
  });
  const [customLocationNotes, setCustomLocationNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedStaffId) {
      const found = staffList.find(s => s.id === preselectedStaffId && s.status === 'on_duty');
      if (found) {
        setSelectedStaff(found);
        setStep('choose_services');
      }
      setPreselectedStaffId(null);
    }
  }, [preselectedStaffId, staffList, setPreselectedStaffId]);

  useEffect(() => {
    setGuestLocation(location);
  }, [location, setGuestLocation]);

  const handleSelectStaff = (staff: Staff) => {
    playClickSound();
    setSelectedStaff(staff);
    setStep('choose_services');
    setErrorMsg(null);
  };

  const updateQuantity = (type: ChekiServiceType, delta: number) => {
    playClickSound();
    setQuantities(prev => {
      const cur = prev[type] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [type]: next };
    });
  };

  const totalQuantity = ((quantities.without_sign || 0) + (quantities.with_sign || 0) + (quantities.with_art_sign || 0));

  const calculateTotal = () => {
    if (!selectedStaff) return 0;
    const p1Price = selectedStaff.chekiServices?.without_sign?.price ?? 80000;
    const p2Price = selectedStaff.chekiServices?.with_sign?.price ?? 150000;
    const p3Price = selectedStaff.chekiServices?.with_art_sign?.price ?? 300000;

    const p1 = (quantities.without_sign || 0) * p1Price;
    const p2 = (quantities.with_sign || 0) * p2Price;
    const p3 = (quantities.with_art_sign || 0) * p3Price;
    return p1 + p2 + p3;
  };

  const grandTotal = calculateTotal();

  const handleSubmitChekiOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!selectedStaff) {
      setErrorMsg('請先選擇一位想要合照服務的店員');
      setStep('choose_staff');
      return;
    }

    if (totalQuantity <= 0) {
      setErrorMsg('請至少選擇 1 張拍立得服務（拍立得無簽 / 有簽 / 簽繪）');
      return;
    }

    if (!location.trim()) {
      setErrorMsg('請填寫或選擇您的所在位置/桌號');
      return;
    }

    const items: Array<{
      type: ChekiServiceType;
      name: string;
      price: number;
      quantity: number;
      poseRequest?: string;
    }> = [];

    const withoutSignPrice = selectedStaff.chekiServices?.without_sign?.price ?? 80000;
    const withSignPrice = selectedStaff.chekiServices?.with_sign?.price ?? 150000;
    const withArtSignPrice = selectedStaff.chekiServices?.with_art_sign?.price ?? 300000;

    if (quantities.without_sign > 0) {
      items.push({
        type: 'without_sign',
        name: '拍立得(無簽)',
        price: withoutSignPrice,
        quantity: quantities.without_sign
      });
    }

    if (quantities.with_sign > 0) {
      items.push({
        type: 'with_sign',
        name: '拍立得(有簽)',
        price: withSignPrice,
        quantity: quantities.with_sign
      });
    }

    if (quantities.with_art_sign > 0) {
      items.push({
        type: 'with_art_sign',
        name: '拍立得(簽繪)',
        price: withArtSignPrice,
        quantity: quantities.with_art_sign
      });
    }

    const fullLocation = customLocationNotes 
      ? `${location} (${customLocationNotes})` 
      : location;

    try {
      const newOrder = await addChekiOrder({
        staffId: selectedStaff.id,
        staffName: `${selectedStaff.name} (${selectedStaff.nickname})`,
        staffAvatar: selectedStaff.avatar,
        location: fullLocation,
        guestName: guestName.trim() || 'VIP貴賓',
        items,
        remarks: '',
        totalAmount: grandTotal
      });

      setLastPlacedOrder(newOrder);
      setCustomerView('orders_status');
    } catch (err) {
      console.error('Error submitting cheki order:', err);
      setErrorMsg('送出訂單時發生問題，請再試一次');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              playClickSound();
              if (step === 'choose_services') {
                setStep('choose_staff');
              } else {
                setCustomerView('home');
              }
            }}
            className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            id="btn-cheki-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-[#9cb7d1] text-[10px] font-bold tracking-widest uppercase">
                CHEKI PHOTO SERVICE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#5c7c99]/20 border border-[#6e8ca6]/30 text-[#9cb7d1] text-[11px] font-mono font-bold">
                80,000 ~ 300,000 Gil
              </span>
            </div>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-white mt-1">
              拍立得攝影服務
            </h1>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-[#0b0f17] border border-white/10 p-1.5 rounded-2xl text-xs">
          <button
            onClick={() => { playClickSound(); setStep('choose_staff'); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              step === 'choose_staff'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            1. 選擇店員
          </button>
          <button
            onClick={() => {
              if (selectedStaff) {
                playClickSound();
                setStep('choose_services');
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              step === 'choose_services'
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                : 'text-white/50 hover:text-white'
            }`}
          >
            2. 選擇服務項目
          </button>
        </div>
      </div>

      {/* STEP 1: 先選擇想要的店員 (Select Staff First) */}
      {step === 'choose_staff' && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="font-serif-luxury text-lg font-bold text-white">步驟一：請先選擇您想要合照服務的店員</h2>
            </div>
            <p className="text-xs text-[#9cb7d1]">
              每位店員皆提供專屬的「無簽」、「親筆簽名」與「精緻手繪簽繪」拍立得服務。
            </p>
          </div>

          {onDutyStaffList.length === 0 ? (
            <div className="text-center py-10 bg-white/[0.02] border border-white/10 rounded-2xl">
              <p className="text-sm text-white/60">目前暫無在班店員，請稍候或向工作人員洽詢。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {onDutyStaffList.map(staff => {
                const isCurrent = selectedStaff?.id === staff.id;

                return (
                  <div
                    key={staff.id}
                    onClick={() => handleSelectStaff(staff)}
                    className={`relative rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group ${
                      isCurrent
                        ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.25)]'
                        : 'bg-[#0b0f17] border-white/10 hover:border-blue-400/50 hover:bg-white/[0.02]'
                    }`}
                    id={`cheki-staff-choice-${staff.id}`}
                  >
                    <div>
                      <div className="flex items-start gap-3.5">
                        <div className="relative">
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-18 h-18 rounded-2xl object-cover border border-white/20 group-hover:border-blue-400 transition-colors shadow-md"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0b0f17] bg-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-white text-lg truncate">{staff.name}</h3>
                            <span className="text-xs text-white/50 truncate">({staff.nickname})</span>
                          </div>
                          <div className="text-xs text-[#9cb7d1] font-medium truncate mt-0.5">{staff.title}</div>
                        </div>
                      </div>

                      {/* Available services summary teaser */}
                      <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                          <div className="text-[10px] text-white/50">無簽</div>
                          <div className="text-xs font-bold text-white mt-0.5">{(staff.chekiServices?.without_sign?.price ?? 80000).toLocaleString()} Gil</div>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                          <div className="text-[10px] text-white/50">有簽</div>
                          <div className="text-xs font-bold text-blue-400 mt-0.5">{(staff.chekiServices?.with_sign?.price ?? 150000).toLocaleString()} Gil</div>
                        </div>
                        <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5">
                          <div className="text-[10px] text-white/50">簽繪</div>
                          <div className="text-xs font-bold text-[#9cb7d1] mt-0.5">
                            {staff.chekiServices?.with_art_sign?.available !== false ? `${(staff.chekiServices?.with_art_sign?.price ?? 300000).toLocaleString()} Gil` : '暫停'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3">
                      <button
                        type="button"
                        onClick={() => handleSelectStaff(staff)}
                        className="w-full py-3 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(159,181,195,0.25)] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>選擇 {staff.name} 並查看拍立得服務</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: 再來顯示該店員提供的服務 (Display Selected Staff's Services) */}
      {step === 'choose_services' && selectedStaff && (
        <form onSubmit={handleSubmitChekiOrder} className="space-y-6">
          
          {/* Selected Staff Header Card with Switch button */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedStaff.avatar}
                  alt={selectedStaff.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-blue-400/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full border border-[#0b0f17]">
                  在班
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9cb7d1] font-semibold">已指定合照店員：</span>
                  <span className="text-xl font-extrabold text-white">{selectedStaff.name}</span>
                  <span className="text-xs text-white/50 font-medium">({selectedStaff.nickname})</span>
                </div>
                <div className="text-xs text-white/70 mt-0.5">{selectedStaff.title}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { playClickSound(); setStep('choose_staff'); }}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white/80 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              id="btn-switch-staff"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>更換其他店員</span>
            </button>
          </div>

          {/* Location & Guest Info for Photo */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h3 className="font-serif-luxury font-bold text-white text-base">拍攝所在區域與貴賓稱呼</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2">
                  所在區域 (選擇區域) <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
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

              <div>
                <label className="block text-xs font-semibold text-white/80 mb-2">
                  角色ID (拍立得寫名/署名對象)
                </label>
                <input
                  type="text"
                  placeholder="例如：Noctis、小雅、Alex"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-blue-400/70"
                  id="input-cheki-guest-name"
                />
                <p className="text-[11px] text-[#9cb7d1] mt-2">
                  填寫角色ID讓店員在拍立得簽名時寫下專屬於您的問候！
                </p>
              </div>
            </div>
          </div>

          {/* THE 3 REQUESTED SERVICES (拍立得(無簽)、拍立得(有簽)、拍立得(簽繪)) */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="font-serif-luxury font-bold text-white text-lg">
                  {selectedStaff.name} 提供的拍立得服務項目
                </h3>
              </div>
              <span className="text-xs text-[#9cb7d1]">可多選並自訂數量與要求</span>
            </div>

            <div className="space-y-4">
              
              {/* Service 1: 拍立得(無簽) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                quantities.without_sign > 0
                  ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                  : 'bg-[#0b0f17] border-white/10 hover:border-white/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white/80 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">拍立得 (無簽)</h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white/70 border border-white/10">
                          {selectedStaff.chekiServices?.without_sign?.badge || '經典留念'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedStaff.chekiServices?.without_sign?.description || '與店員合照或單人拍立得一張，純底片原汁原味收藏。'}
                      </p>
                      <div className="text-blue-400 font-extrabold text-base mt-2">
                        {(selectedStaff.chekiServices?.without_sign?.price ?? 80000).toLocaleString()} Gil <span className="text-xs text-[#9cb7d1] font-normal">/ 張</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-3 self-end sm:self-center bg-[#0b0f17] border border-white/10 p-2 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => updateQuantity('without_sign', -1)}
                      className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white flex items-center justify-center font-bold border border-white/10 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-black text-white text-base">
                      {quantities.without_sign}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity('without_sign', 1)}
                      className="w-8 h-8 rounded-xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Service 2: 拍立得(有簽) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                quantities.with_sign > 0
                  ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                  : 'bg-[#0b0f17] border-white/10 hover:border-white/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-[#9cb7d1] shrink-0">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">拍立得 (有簽)</h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold">
                          {selectedStaff.chekiServices?.with_sign?.badge || '★ 人氣推薦'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedStaff.chekiServices?.with_sign?.description || '店員親筆簽名 + 專屬署名 + 當天日期 + 溫馨心情短語。'}
                      </p>
                      <div className="text-blue-400 font-extrabold text-base mt-2">
                        {(selectedStaff.chekiServices?.with_sign?.price ?? 150000).toLocaleString()} Gil <span className="text-xs text-[#9cb7d1] font-normal">/ 張</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-3 self-end sm:self-center bg-[#0b0f17] border border-white/10 p-2 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => updateQuantity('with_sign', -1)}
                      className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white flex items-center justify-center font-bold border border-white/10 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-black text-white text-base">
                      {quantities.with_sign}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity('with_sign', 1)}
                      className="w-8 h-8 rounded-xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Service 3: 拍立得(簽繪) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                selectedStaff.chekiServices?.with_art_sign?.available === false
                  ? 'bg-[#0b0f17]/40 border-white/5 opacity-50'
                  : quantities.with_art_sign > 0
                  ? 'bg-blue-600/15 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                  : 'bg-[#0b0f17] border-white/10 hover:border-white/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-300 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">拍立得 (簽繪)</h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-[#9cb7d1] border border-blue-500/30 font-bold">
                          {selectedStaff.chekiServices?.with_art_sign?.badge || '✨ 限量手繪大作'}
                        </span>
                        {selectedStaff.chekiServices?.with_art_sign?.available === false && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">今日額滿</span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedStaff.chekiServices?.with_art_sign?.description || '由店員全手工繪製專屬Q版插畫、華麗邊框彩繪與客製祝福，極具收藏價值！'}
                      </p>
                      <div className="text-blue-400 font-extrabold text-base mt-2">
                        {(selectedStaff.chekiServices?.with_art_sign?.price ?? 300000).toLocaleString()} Gil <span className="text-xs text-[#9cb7d1] font-normal">/ 張 (精緻手繪)</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  {selectedStaff.chekiServices?.with_art_sign?.available !== false ? (
                    <div className="flex items-center gap-3 self-end sm:self-center bg-[#0b0f17] border border-white/10 p-2 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => updateQuantity('with_art_sign', -1)}
                        className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white flex items-center justify-center font-bold border border-white/10 transition-all cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-black text-white text-base">
                        {quantities.with_art_sign}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity('with_art_sign', 1)}
                        className="w-8 h-8 rounded-xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-white/40 font-medium">暫未開放</div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Validation Banner */}
          {errorMsg && (
            <div className="bg-blue-900/30 border border-blue-500/50 text-[#9cb7d1] px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="bg-white/[0.04] backdrop-blur-xl border-2 border-blue-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <div className="text-xs text-white/60 font-medium">
                {location} • 店員：<span className="text-blue-300 font-bold">{selectedStaff.name}</span> • 共選 <span className="text-white font-bold">{totalQuantity}</span> 張拍立得
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-[#9cb7d1]">服務金額總計</span>
                <span className="font-serif-luxury text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white">{grandTotal.toLocaleString()} Gil</span>
                <span className="text-[11px] text-white/40">(含底片與指定店員簽繪服務)</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { playClickSound(); setStep('choose_staff'); }}
                className="px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer"
              >
                返回選店員
              </button>
              <button
                type="submit"
                disabled={totalQuantity === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] disabled:opacity-50 disabled:cursor-not-allowed text-[#0b0f17] font-black text-sm shadow-[0_0_30px_rgba(159,181,195,0.35)] transition-all cursor-pointer"
                id="btn-submit-cheki-order"
              >
                <Camera className="w-4 h-4" />
                <span>送出拍立得預約訂單 ({grandTotal.toLocaleString()} Gil)</span>
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
