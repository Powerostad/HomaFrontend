/**
 * AuthModal - مودال ورود با OTP
 *
 * Features:
 * - Phone number input with Persian digit support
 * - OTP verification with countdown timer
 * - Error handling with Persian messages
 * - Remaining attempts display
 * - Rate limiting feedback
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
  normalizePhoneNumber,
  isValidPhoneNumber,
} from "@/services/authService";
import type { User, AuthTokens } from "@/types/auth";

// =============================================================================
// Types
// =============================================================================

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, tokens: AuthTokens) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  // Form state
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Refs
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // ==========================================================================
  // Countdown timer
  // ==========================================================================
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // ==========================================================================
  // Auto-submit OTP when 6 digits entered
  // ==========================================================================
  const autoSubmitTriggered = React.useRef(false);

  useEffect(() => {
    // Reset trigger when OTP changes to less than 6 digits
    if (otp.length < 6) {
      autoSubmitTriggered.current = false;
    }

    // Auto-submit when 6 digits entered and not already triggered
    if (otp.length === 6 && step === "otp" && !isLoading && !autoSubmitTriggered.current) {
      autoSubmitTriggered.current = true;
      // Small delay for better UX (shows complete code before submitting)
      const timer = setTimeout(() => {
        verifyOtpCore();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [otp, step, isLoading]);

  // ==========================================================================
  // Reset state when modal opens/closes
  // ==========================================================================
  useEffect(() => {
    if (isOpen) {
      // Reset to initial state when modal opens
      setStep("phone");
      setOtp("");
      setError(null);
      setRemainingAttempts(null);
      autoSubmitTriggered.current = false;
      // Don't reset phone - user might want to retry with same number
    }
  }, [isOpen]);

  // ==========================================================================
  // Auto-focus OTP input when step changes
  // ==========================================================================
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      // Small delay to ensure DOM is ready after step transition
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ==========================================================================
  // Web OTP API - auto-fill from SMS (Chrome Android)
  // TODO Backend: For full Web OTP support, SMS must end with: @yourdomain.com #123456
  // See: https://developer.chrome.com/docs/identity/web-apis/web-otp
  // ==========================================================================
  useEffect(() => {
    if (step !== "otp") return;

    // Check if Web OTP API is supported (Chrome Android 84+)
    if (!("OTPCredential" in window)) return;

    const abortController = new AbortController();

    navigator.credentials
      .get({
        // @ts-expect-error - Web OTP API types not in TypeScript standard lib
        otp: { transport: ["sms"] },
        signal: abortController.signal,
      })
      .then((credential: unknown) => {
        // @ts-expect-error - OTPCredential type not in TypeScript standard lib
        const otpCode = credential?.code;
        if (otpCode) {
          // Normalize to 6 digits
          const normalized = otpCode.replace(/[^0-9]/g, "").slice(0, 6);
          setOtp(normalized);
        }
      })
      .catch((err: Error) => {
        // User cancelled or timeout - ignore gracefully
        if (err.name !== "AbortError") {
          console.log("[AuthModal] Web OTP not available:", err.message);
        }
      });

    return () => abortController.abort();
  }, [step]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  /**
   * Send OTP to phone number
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      setError("لطفاً یک شماره موبایل معتبر وارد کنید");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await sendOTP(normalizedPhone);

      if (result.success) {
        setStep("otp");
        setCountdown(result.expiresIn || 180); // Default 3 minutes
        setRemainingAttempts(5); // Reset attempts for new OTP
        setOtp(""); // Clear any previous OTP
      } else {
        setError(result.error || "خطا در ارسال کد تایید");
      }
    } catch (err) {
      console.error("[AuthModal] Send OTP error:", err);
      setError("خطا در اتصال به سرور. لطفا دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Core OTP verification logic (used by both manual submit and auto-submit)
   */
  const verifyOtpCore = async () => {
    if (otp.length !== 6) {
      setError("کد تایید باید ۶ رقم باشد");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await verifyOTP(normalizedPhone, otp);

      if (result.success && result.user && result.tokens) {
        // Success! Call onSuccess with user and tokens
        onSuccess(result.user, result.tokens);
      } else {
        // Handle error
        setError(result.error || "کد تایید نامعتبر است");

        // Update remaining attempts if provided
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);

          // If no attempts left, enable resend
          if (result.remainingAttempts === 0) {
            setCountdown(0);
          }
        }

        // If OTP expired, enable resend
        if (result.error?.includes("منقضی")) {
          setCountdown(0);
        }
      }
    } catch (err) {
      console.error("[AuthModal] Verify OTP error:", err);
      setError("خطا در اتصال به سرور. لطفا دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP code (manual form submit)
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpCore();
  };

  /**
   * Resend OTP code
   */
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await resendOTP(normalizedPhone);

      if (result.success) {
        setCountdown(result.expiresIn || 180);
        setOtp("");
        setRemainingAttempts(5); // Reset attempts
        setError(null);
      } else {
        setError(result.error || "خطا در ارسال مجدد کد");
      }
    } catch (err) {
      console.error("[AuthModal] Resend OTP error:", err);
      setError("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  /**
   * Go back to phone step
   */
  const handleChangePhone = () => {
    setStep("phone");
    setOtp("");
    setError(null);
    setCountdown(0);
    setRemainingAttempts(null);
    autoSubmitTriggered.current = false;
  };

  // ==========================================================================
  // Render
  // ==========================================================================

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
                <span className="text-[10px] font-bold text-black/60 uppercase tracking-[0.4em]">
                  HOMA Platform
                </span>
                <div className="h-[1px] w-6 bg-black/20" />
              </div>

              <h2 className="text-[26px] font-bold text-black tracking-tight leading-tight">
                {step === "phone" ? "شماره موبایل" : "تایید شماره موبایل"}
              </h2>
            </div>

            {/* Form / Content */}
            <div className="space-y-6">
              {step === "phone" ? (
                // Phone Input Form
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      شماره موبایل
                    </label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type="tel"
                        placeholder="09123456789"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-4 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-[11px] font-bold text-destructive text-center py-3 px-4 bg-destructive/10 rounded-[var(--radius-sm)]"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
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
                // OTP Verification Form
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      کد تایید
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => {
                          // Allow only digits, max 6
                          const value = e.target.value.replace(/[^0-9۰-۹٠-٩]/g, "");
                          // Normalize Persian/Arabic digits to English
                          const normalized = normalizePhoneNumber(value);
                          setOtp(normalized.slice(0, 6));
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-4 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[24px] font-bold tracking-[0.5em] text-center"
                        dir="ltr"
                      />
                    </div>

                    {/* Phone change & Countdown/Resend */}
                    <div className="flex justify-between px-1">
                      <button
                        type="button"
                        onClick={handleChangePhone}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors disabled:opacity-50"
                      >
                        تغییر شماره
                      </button>
                      <span className="text-[11px] font-bold text-black/40">
                        {countdown > 0 ? (
                          `${Math.floor(countdown / 60)}:${(countdown % 60)
                            .toString()
                            .padStart(2, "0")}`
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isLoading}
                            className="text-black hover:underline disabled:opacity-50"
                          >
                            ارسال مجدد
                          </button>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Remaining attempts warning */}
                  {remainingAttempts !== null && remainingAttempts <= 2 && remainingAttempts > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-medium text-amber-600 text-center py-2 px-4 bg-amber-50 rounded-[var(--radius-sm)]"
                    >
                      {remainingAttempts} تلاش باقی مانده
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-[11px] font-bold text-destructive text-center py-3 px-4 bg-destructive/10 rounded-[var(--radius-sm)]"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
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
                        <span>تایید و ادامه</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer Note */}
            <p className="mt-10 text-[11px] text-center text-black/30 font-medium leading-relaxed">
              با ورود به هُما، شما با تمامی{" "}
              <span className="text-black/50 underline underline-offset-4 cursor-pointer">
                قوانین حریم خصوصی
              </span>{" "}
              و{" "}
              <span className="text-black/50 underline underline-offset-4 cursor-pointer">
                شرایط استفاده
              </span>{" "}
              موافقت می‌کنید.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AuthModal;
