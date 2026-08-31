import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle } from 'lucide-react';
import { playClickSound, playOrderSuccessSound } from '../../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setErrorMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!password.trim()) {
      setError(true);
      setErrorMessage('請輸入管理員密碼');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // Verify Password: 35queen53
    setTimeout(() => {
      if (password === '35queen53') {
        playOrderSuccessSound();
        setError(false);
        setPassword('');
        setIsSubmitting(false);
        onSuccess();
      } else {
        setError(true);
        setErrorMessage('驗證密碼錯誤，請重新輸入');
        setIsSubmitting(false);
        setPassword('');
        inputRef.current?.focus();
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f17] border border-white/20 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] relative animate-scale-up">
        
        {/* Subtle top ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-600/20 rounded-full blur-[70px] pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 pt-8 text-center relative border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-[0_0_25px_rgba(37,99,235,0.25)]">
            <Lock className="w-7 h-7" />
          </div>
          <span className="px-3 py-0.5 rounded-full bg-blue-600/15 text-[#9cb7d1] border border-blue-500/30 text-[10px] font-bold uppercase tracking-[0.2em]">
            STAFF ACCESS ONLY
          </span>
          <h3 className="font-serif-luxury font-bold text-xl text-white mt-2">
            三月森夜 後台權限驗證
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
            請輸入管理人員密碼以進入即時調度與營收管理系統
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              管理員安全密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="請輸入後台密碼"
                autoComplete="current-password"
                className={`w-full pl-10 pr-11 py-3 bg-white/[0.04] border rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-white/20 font-mono ${
                  error 
                    ? 'border-rose-500 focus:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]' 
                    : 'border-white/15 focus:border-blue-400 focus:bg-white/[0.07] shadow-inner'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-2 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="w-1/3 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors cursor-pointer"
            >
              取消返回
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-[#9FB5C3] hover:bg-[#b0c4d1] text-[#0b0f17] font-bold text-xs shadow-[0_0_20px_rgba(159,181,195,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? '正在驗證...' : '解鎖並進入後台'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
