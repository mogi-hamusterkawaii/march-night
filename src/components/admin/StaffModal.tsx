import React, { useState, useEffect } from 'react';
import { Staff } from '../../types';
import { X, UserCheck, Sparkles, Camera, Flame } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface StaffModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Staff | Omit<Staff, 'id'>) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Omit<Staff, 'id'>>({
    name: '',
    nickname: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    title: '特調調酒師',
    bio: '',
    status: 'on_duty',
    flairSpecialty: '',
    flairSkillRating: 5,
    centerAvailability: true,
    tags: ['專業服務'],
    chekiServices: {
      without_sign: { available: true, price: 80000, description: '標準拍立得一張' },
      with_sign: { available: true, price: 150000, description: '親筆簽名 + 專屬寄語' },
      with_art_sign: { available: true, price: 300000, description: '手繪萌系插畫與彩繪塗鴉' }
    },
    totalCenterOrdersCount: 0,
    totalChekiCount: 0
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        nickname: staff.nickname,
        avatar: staff.avatar,
        title: staff.title,
        bio: staff.bio,
        status: staff.status,
        flairSpecialty: staff.flairSpecialty,
        flairSkillRating: staff.flairSkillRating || 5,
        centerAvailability: staff.centerAvailability,
        tags: staff.tags || ['專業服務'],
        chekiServices: {
          without_sign: { ...staff.chekiServices.without_sign },
          with_sign: { ...staff.chekiServices.with_sign },
          with_art_sign: { ...staff.chekiServices.with_art_sign }
        },
        totalCenterOrdersCount: staff.totalCenterOrdersCount || 0,
        totalChekiCount: staff.totalChekiCount || 0
      });
    } else {
      setFormData({
        name: '',
        nickname: '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        title: '花式調酒師',
        bio: '熱情活潑，擅長與客人互動與桌邊調酒。',
        status: 'on_duty',
        flairSpecialty: '高空三瓶旋轉抛接 / 焰火吞吐特調',
        flairSkillRating: 5,
        centerAvailability: true,
        tags: ['專業服務'],
        chekiServices: {
          without_sign: { available: true, price: 80000, description: '標準拍立得合照一張' },
          with_sign: { available: true, price: 150000, description: '親筆簽名 + 專屬署名' },
          with_art_sign: { available: true, price: 300000, description: '客製手繪圖騰與祝福彩繪' }
        },
        totalCenterOrdersCount: 0,
        totalChekiCount: 0
      });
    }
  }, [staff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const payload = {
      ...formData,
      tags: staff?.tags && staff.tags.length > 0 ? staff.tags : ['專業服務'],
      flairSkillRating: formData.flairSkillRating || 5
    };

    if (staff) {
      onSave({ ...payload, id: staff.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b0f17] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-white">
              {staff ? `編輯店員資料 - ${staff.name}` : '新增店員 / 調酒師'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                店員姓名 / 藝名 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                placeholder="例如：三月五日"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                英文暱稱 / Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                placeholder="例如：March"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                職稱
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                placeholder="例如：首席火焰花式調酒師"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                在班狀態
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'on_duty' | 'break' | 'off_duty' })}
                className="w-full bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
              >
                <option value="on_duty">🟢 在班服務中 (On Duty)</option>
                <option value="break">🟡 休息中 (Break)</option>
                <option value="off_duty">⚪ 今日未排班 (Off Duty)</option>
              </select>
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">
              大頭貼照片 URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                required
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                className="flex-1 bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
              />
              <img
                src={formData.avatar}
                alt="preview"
                className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">
              個人自我介紹 / 特色描述
            </label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#070a10] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
              placeholder="描述店員的魅力、調酒風格或拍立得互動特長..."
            />
          </div>

          {/* Flair Bartending Center Settings */}
          <div className="bg-[#070a10] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-sm mb-3">
              <Flame className="w-4 h-4 text-blue-400" />
              <span>花式調酒 C 位設定</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">
                花式拿手絕活 (Specialty)
              </label>
              <input
                type="text"
                value={formData.flairSpecialty}
                onChange={e => setFormData({ ...formData, flairSpecialty: e.target.value })}
                className="w-full bg-[#0b0f17] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                placeholder="例如：高空烈焰抛接 / 魔幻乾冰"
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="center-avail-check"
                checked={formData.centerAvailability}
                onChange={e => setFormData({ ...formData, centerAvailability: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-[#0b0f17] border-white/20 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="center-avail-check" className="text-xs text-white/80 cursor-pointer">
                開放客人指定為【花式調酒 C 位店員】
              </label>
            </div>
          </div>

          {/* Cheki 3 Services Pricing Setting */}
          <div className="bg-[#070a10] border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[#9cb7d1] font-bold text-sm mb-3">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>拍立得攝影 3 大服務定價與開放</span>
            </div>

            <div className="space-y-3">
              
              {/* 1. 拍立得 (無簽) */}
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#0b0f17] rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.chekiServices.without_sign.available}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        without_sign: { ...formData.chekiServices.without_sign, available: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-[#070a10] rounded border-white/20 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">拍立得 (無簽)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/50">價格</span>
                  <input
                    type="number"
                    value={formData.chekiServices.without_sign.price}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        without_sign: { ...formData.chekiServices.without_sign, price: Number(e.target.value) }
                      }
                    })}
                    className="w-24 bg-[#070a10] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-[#9cb7d1] font-mono">Gil</span>
                </div>
              </div>

              {/* 2. 拍立得 (有簽) */}
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#0b0f17] rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.chekiServices.with_sign.available}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        with_sign: { ...formData.chekiServices.with_sign, available: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-[#070a10] rounded border-white/20 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">拍立得 (有簽)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/50">價格</span>
                  <input
                    type="number"
                    value={formData.chekiServices.with_sign.price}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        with_sign: { ...formData.chekiServices.with_sign, price: Number(e.target.value) }
                      }
                    })}
                    className="w-24 bg-[#070a10] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-[#9cb7d1] font-mono">Gil</span>
                </div>
              </div>

              {/* 3. 拍立得 (簽繪) */}
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#0b0f17] rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.chekiServices.with_art_sign.available}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        with_art_sign: { ...formData.chekiServices.with_art_sign, available: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 bg-[#070a10] rounded border-white/20 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">拍立得 (簽繪)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-white/50">價格</span>
                  <input
                    type="number"
                    value={formData.chekiServices.with_art_sign.price}
                    onChange={e => setFormData({
                      ...formData,
                      chekiServices: {
                        ...formData.chekiServices,
                        with_art_sign: { ...formData.chekiServices.with_art_sign, price: Number(e.target.value) }
                      }
                    })}
                    className="w-24 bg-[#070a10] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-[#9cb7d1] font-mono">Gil</span>
                </div>
              </div>

            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white/70 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              儲存店員資料
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
