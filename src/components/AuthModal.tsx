import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import type { User } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.startsWith("09") || phone.length !== 11) {
      setError("لطفاً یک شماره موبایل معتبر وارد کنید");
      return;
    }
    setError(null);
    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setCountdown(120);
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("کد تایید باید ۶ رقم باشد");
      return;
    }
    setError(null);
    setIsLoading(true);

    // Mock verification
    setTimeout(() => {
      setIsLoading(false);
      const mockUser = { id: "u123", name: "کاربر هُما", phone };
      onSuccess(mockUser);
    }, 1500);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden relative backdrop-blur-[40px] bg-white/30 border border-white/40 rounded-[var(--radius-card)]"
          style={{ 
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Decorative Shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

          <div className="p-10 relative z-10">
            {/* Branding */}
            <div className="text-center mb-10 space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-[1px] w-6 bg-black/20" />
                <span className="text-[10px] font-bold text-black/60 uppercase tracking-[0.4em]">HOMA Platform</span>
                <div className="h-[1px] w-6 bg-black/20" />
              </div>
              
              <h2 className="text-[26px] font-bold text-black tracking-tight leading-tight">
                {step === "phone" ? "شماره موبایل" : "تایید شماره موبایل"}
              </h2>
              
              {/* Removed the description paragraph as requested */}
            </div>

            {/* Form / Content */}
            <div className="space-y-6">
              {step === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">شماره موبایل</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type="tel"
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-4 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-destructive text-center py-2 bg-destructive/5 rounded-sm">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-[var(--radius-sm)] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>دریافت کد تایید</span>
                        <ArrowRight size={18} className="rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">کد تایید</label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type="text"
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-4 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[24px] font-bold tracking-[0.5em] text-center"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex justify-between px-1">
                      <button 
                        type="button" 
                        onClick={() => setStep("phone")}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors"
                      >
                        تغییر شماره
                      </button>
                      <span className="text-[11px] font-bold text-black/40">
                        {countdown > 0 ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")}` : (
                          <button type="button" className="text-black hover:underline" onClick={() => setCountdown(120)}>ارسال مجدد</button>
                        )}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] font-bold text-destructive text-center py-2 bg-destructive/5 rounded-sm">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-[var(--radius-sm)] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>تایید و مشاهده نتیجه</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer Note */}
            <p className="mt-10 text-[11px] text-center text-black/30 font-medium leading-relaxed">
              با ورود به هُما، شما با تمامی <span className="text-black/50 underline underline-offset-4 cursor-pointer">قوانین حریم خصوصی</span> و <span className="text-black/50 underline underline-offset-4 cursor-pointer">شرایط استفاده</span> موافقت می‌کنید.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}