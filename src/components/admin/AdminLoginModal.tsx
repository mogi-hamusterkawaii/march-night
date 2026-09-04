import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, Mail } from 'lucide-react';
import { playClickSound, playOrderSuccessSound } from '../../utils/audio';
import { supabase } from '../../lib/supabase';

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
  const [email, setEmail] = useState('admin@marchnight.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setErrorMessage('');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!email.trim()) {
      setError(true);
      setErrorMessage('請輸入管理員信箱帳號');
      return;
    }

    if (!password.trim()) {
      setError(true);
      setErrorMessage('請輸入管理員安全密碼');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(false);
    setErrorMessage('');

    try {
      // Authenticate directly via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        setError(true);
        if (authError.message.includes('Invalid login credentials')) {
          setErrorMessage('登入失敗：管理員信箱或密碼錯誤。請確認已在 Supabase 後台 Authentication 建立此帳號。');
        } else if (authError.message.includes('Email not confirmed')) {
          setErrorMessage('登入失敗：該管理員信箱尚未驗證。請在 Supabase Dashboard 將信箱標記為確認 (Auto-confirm)。');
        } else {
          setErrorMessage(`登入失敗：${authError.message}`);
        }
        setIsSubmitting(false);
        setPassword('');
        passwordInputRef.current?.focus();
        return;
      }

      if (data.session) {
        playOrderSuccessSound();
        setError(false);
        setPassword('');
        setIsSubmitting(false);
        onSuccess();
      } else {
        throw new Error('未能建立有效的管理員驗證階段');
      }
    } catch (err: any) {
      console.error('Supabase auth login error:', err);
      setError(true);
      setErrorMessage(err.message || '連線驗證伺服器失敗，請稍後重試');
      setIsSubmitting(false);
    }
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
            SUPABASE AUTH PROTECTED
          </span>
          <h3 className="font-serif-luxury font-bold text-xl text-white mt-2">
            三月森夜 後台權限登入
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
            使用 Supabase 雲端管理員身分安全驗證以啟用後台調度與數據存取
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              管理員帳號信箱 (Supabase Auth Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="admin@marchnight.com"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/15 focus:border-blue-400 focus:bg-white/[0.07] rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-white/20 font-mono shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              管理員密碼 (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="請輸入 Supabase 管理員密碼"
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
              <div className="flex items-start gap-1.5 text-rose-400 text-xs mt-2.5 animate-shake bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
              <span>{isSubmitting ? '驗證登入中...' : '登入後台'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
