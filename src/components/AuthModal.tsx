/**
 * AuthModal - مودال ورود با OTP و رمز عبور
 *
 * Features:
 * - Phone number input with Persian digit support
 * - OTP verification with countdown timer
 * - Password login as secondary option
 * - Password reset flow
 * - Error handling with Persian messages
 * - Remaining attempts display
 * - Rate limiting feedback
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  sendOTP,
  verifyOTP,
  resendOTP,
  loginWithPassword,
  sendOTPForReset,
  resetPassword,
  checkUser,
  setPassword as setUserPassword,
  normalizePhoneNumber,
  isValidPhoneNumber,
} from "@/services/authService";
import type { User, AuthTokens } from "@/types/auth";

// =============================================================================
// Types
// =============================================================================

type AuthStep = "phone" | "otp" | "password" | "login" | "set-password" | "register" | "reset-otp" | "reset-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, tokens: AuthTokens) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useTranslation();

  // Auth mode from environment variable
  const authMode = import.meta.env.VITE_AUTH_MODE || 'password';

  // Form state
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('auth-modal-open');
    return () => {
      document.body.classList.remove('auth-modal-open');
    };
  }, [isOpen]);

  // Refs
  const otpInputRef = React.useRef<HTMLInputElement>(null);
  const passwordInputRef = React.useRef<HTMLInputElement>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  // Auto-submit OTP when 6 digits entered (only for login OTP step)
  // ==========================================================================
  const autoSubmitTriggered = React.useRef(false);

  useEffect(() => {
    // Reset trigger when OTP changes to less than 6 digits
    if (otp.length < 6) {
      autoSubmitTriggered.current = false;
    }

    // Auto-submit when 6 digits entered and not already triggered (only for OTP login step)
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
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setName("");
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError(null);
      setSuccessMessage(null);
      setRemainingAttempts(null);
      autoSubmitTriggered.current = false;
      // Don't reset phone - user might want to retry with same number
    }
  }, [isOpen]);

  // ==========================================================================
  // Auto-focus inputs when step changes
  // ==========================================================================
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    if (step === "password" && passwordInputRef.current) {
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ==========================================================================
  // Web OTP API - auto-fill from SMS (Chrome Android)
  // ==========================================================================
  useEffect(() => {
    if (step !== "otp" && step !== "reset-password") return;

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
          const normalized = otpCode.replace(/[^0-9]/g, "").slice(0, 6);
          setOtp(normalized);
        }
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          console.log("[AuthModal] Web OTP not available:", err.message);
        }
      });

    return () => abortController.abort();
  }, [step]);

  // ==========================================================================
  // Handlers - OTP Flow
  // ==========================================================================

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      setError(t('auth.validation.phoneInvalid'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Password mode: check user existence first
      if (authMode === 'password') {
        const result = await checkUser(normalizedPhone);

        if (result.success) {
          if (!result.exists) {
            // New user - go to registration
            setStep("register");
          } else if (!result.hasPassword) {
            // Existing OTP user without password - go to set password
            setStep("set-password");
          } else {
            // Existing user with password - go to login
            setStep("login");
          }
        } else {
          setError(result.error || t('auth.errors.networkError'));
        }
      } else {
        // OTP mode: send OTP as before
        const result = await sendOTP(normalizedPhone);

        if (result.success) {
          setStep("otp");
          setCountdown(result.expiresIn || 180);
          setRemainingAttempts(5);
          setOtp("");
        } else {
          setError(result.error || t('auth.errors.networkError'));
        }
      }
    } catch (err) {
      console.error("[AuthModal] Phone submit error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpCore = async () => {
    if (otp.length !== 6) {
      setError(t('auth.validation.otpInvalid'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await verifyOTP(normalizedPhone, otp);

      if (result.success && result.user && result.tokens) {
        onSuccess(result.user, result.tokens);
      } else {
        setError(result.error || t('auth.errors.otpInvalid'));

        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
          if (result.remainingAttempts === 0) {
            setCountdown(0);
          }
        }

        if (result.error?.includes("منقضی")) {
          setCountdown(0);
        }
      }
    } catch (err) {
      console.error("[AuthModal] Verify OTP error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpCore();
  };

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
        setRemainingAttempts(5);
        setError(null);
      } else {
        setError(result.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Resend OTP error:", err);
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Handlers - Password Login Flow
  // ==========================================================================

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      setError(t('auth.validation.phoneInvalid'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.validation.passwordTooShort'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await loginWithPassword(normalizedPhone, password);

      if (result.success && result.user && result.tokens) {
        onSuccess(result.user, result.tokens);
      } else {
        setError(result.error || t('auth.errors.invalidCredentials'));
      }
    } catch (err) {
      console.error("[AuthModal] Password login error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Handlers - Set Password for OTP Users
  // ==========================================================================

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError(t('auth.validation.passwordMin8', { defaultValue: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await setUserPassword(normalizedPhone, newPassword, confirmPassword);

      if (result.success && result.user && result.tokens) {
        onSuccess(result.user, result.tokens);
      } else {
        setError(result.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Set password error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Handlers - Registration (New User)
  // ==========================================================================

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('auth.validation.nameRequired', { defaultValue: 'نام و نام خانوادگی الزامی است' }));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.validation.passwordMin8', { defaultValue: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);

      // Use the existing register endpoint via apiPost
      const { apiPost } = await import('@/utils/apiClient');
      const response = await apiPost<{user: any; tokens: any}>(
        '/users/register/',
        {
          phone_number: normalizedPhone,
          password: newPassword,
          name: name.trim(),
        },
        { skipAuth: true }
      );

      if (response.success && response.data) {
        const { transformBackendUser } = await import('@/types/auth');
        const user = transformBackendUser(response.data.user);
        const tokens = response.data.tokens;

        // Store auth state
        const { storeAuthState } = await import('@/services/authService');
        storeAuthState(user, tokens);

        onSuccess(user, tokens);
      } else {
        setError(response.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Register error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Handlers - Password Reset Flow
  // ==========================================================================

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidPhoneNumber(normalizedPhone)) {
      setError(t('auth.validation.phoneInvalid'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await sendOTPForReset(normalizedPhone);

      if (result.success) {
        setStep("reset-password");
        setCountdown(result.expiresIn || 180);
        setRemainingAttempts(5);
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Send reset OTP error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(t('auth.validation.otpInvalid'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.validation.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.validation.passwordMismatch'));
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await resetPassword(normalizedPhone, otp, newPassword);

      if (result.success) {
        // Show success message and go to password login
        setSuccessMessage(t('auth.success.passwordChanged'));
        setPassword("");
        setTimeout(() => {
          setSuccessMessage(null);
          setStep("password");
        }, 1500);
      } else {
        setError(result.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Reset password error:", err);
      setError(t('errors.networkError') + '. ' + t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (countdown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const result = await sendOTPForReset(normalizedPhone);

      if (result.success) {
        setCountdown(result.expiresIn || 180);
        setOtp("");
        setRemainingAttempts(5);
        setError(null);
      } else {
        setError(result.error || t('errors.general'));
      }
    } catch (err) {
      console.error("[AuthModal] Resend reset OTP error:", err);
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Navigation Handlers
  // ==========================================================================

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleChangePhone = () => {
    setStep("phone");
    setOtp("");
    setPassword("");
    setError(null);
    setCountdown(0);
    setRemainingAttempts(null);
    autoSubmitTriggered.current = false;
  };

  const handleGoToPasswordLogin = () => {
    setStep("password");
    setPassword("");
    setError(null);
  };

  const handleGoToOtpLogin = () => {
    setStep("phone");
    setError(null);
  };

  const handleGoToForgotPassword = () => {
    if (authMode === 'password') {
      // In password mode, show support contact message
      setError(t('auth.errors.contactSupportForReset', {
        defaultValue: 'برای بازیابی رمز عبور با پشتیبانی تماس بگیرید'
      }));
    } else {
      // OTP mode: go to reset flow
      setStep("reset-otp");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  };

  const handleBackFromResetOtp = () => {
    setStep("password");
    setError(null);
  };

  const handleBackFromResetPassword = () => {
    setStep("reset-otp");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // ==========================================================================
  // Get step title
  // ==========================================================================
  const getStepTitle = (): string => {
    switch (step) {
      case "phone":
        return t('auth.phoneNumber');
      case "otp":
        return t('auth.otp');
      case "password":
        return t('auth.loginWithPassword');
      case "login":
        return t('auth.login');
      case "set-password":
        return t('auth.setPasswordTitle', { defaultValue: 'تنظیم رمز عبور' });
      case "register":
        return t('auth.register', { defaultValue: 'ثبت‌نام' });
      case "reset-otp":
        return t('auth.resetPassword');
      case "reset-password":
        return t('auth.setPassword');
      default:
        return "";
    }
  };

  // ==========================================================================
  // Check if back button should be shown
  // ==========================================================================
  const showBackButton = step === "password" || step === "login" || step === "set-password" || step === "register" || step === "reset-otp" || step === "reset-password";

  const handleBack = () => {
    switch (step) {
      case "password":
      case "login":
      case "set-password":
      case "register":
        handleChangePhone();
        break;
      case "reset-otp":
        handleBackFromResetOtp();
        break;
      case "reset-password":
        handleBackFromResetPassword();
        break;
    }
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
            {/* Back Button */}
            {showBackButton && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="absolute top-6 right-6 p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all disabled:opacity-50"
              >
                <ArrowRight size={20} />
              </button>
            )}

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
                {getStepTitle()}
              </h2>
            </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-[13px] font-bold text-green-700 text-center py-3 px-4 bg-green-100 rounded-[var(--radius-sm)] mb-6"
              >
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Form / Content */}
            <div className="space-y-6">
              {/* ============================================================ */}
              {/* STEP: Phone Input */}
              {/* ============================================================ */}
              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.phoneNumber')}
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
                        <span>{t('auth.getOtp')}</span>
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>

                  {/* Password Login Link */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleGoToPasswordLogin}
                      disabled={isLoading}
                      className="text-[12px] font-medium text-black/50 hover:text-black transition-colors disabled:opacity-50"
                    >
                      {t('auth.loginWithPassword')}
                    </button>
                  </div>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: OTP Verification */}
              {/* ============================================================ */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.otp')}
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
                          const value = e.target.value.replace(/[^0-9۰-۹٠-٩]/g, "");
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
                        {t('common.edit')}
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
                            {t('auth.resendOtp')}
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
                      {remainingAttempts} {t('common.retry')}
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
                        <span>{t('common.confirm')}</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Password Login */}
              {/* ============================================================ */}
              {step === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.phoneNumber')}
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

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Links below password field */}
                    <div className="flex justify-between px-1">
                      <button
                        type="button"
                        onClick={handleChangePhone}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToForgotPassword}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {t('auth.forgotPassword')}
                      </button>
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
                        <span>{t('auth.login')}</span>
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>

                  {/* Divider & OTP Login Link */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex-1 h-[1px] bg-black/10" />
                    <span className="text-[11px] font-bold text-black/30">—</span>
                    <div className="flex-1 h-[1px] bg-black/10" />
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleGoToOtpLogin}
                      disabled={isLoading}
                      className="text-[12px] font-medium text-black/50 hover:text-black transition-colors disabled:opacity-50"
                    >
                      {t('auth.loginWithOtp')}
                    </button>
                  </div>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Login (Password Mode - Existing User) */}
              {/* ============================================================ */}
              {step === "login" && (
                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  {/* Phone Display (subtle) */}
                  <div className="flex items-center justify-center gap-2 text-[13px] text-black/50">
                    <Phone size={14} />
                    <span dir="ltr" className="font-medium">{phone}</span>
                    <button
                      type="button"
                      onClick={handleChangePhone}
                      disabled={isLoading}
                      className="text-black/40 hover:text-black underline disabled:opacity-50"
                    >
                      {t('common.edit')}
                    </button>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Forgot password link */}
                    <div className="flex justify-end px-1">
                      <button
                        type="button"
                        onClick={handleGoToForgotPassword}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {t('auth.forgotPassword')}
                      </button>
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
                        <span>{t('auth.login')}</span>
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Set Password (OTP User without password) */}
              {/* ============================================================ */}
              {step === "set-password" && (
                <form onSubmit={handleSetPassword} className="space-y-5">
                  {/* Info Message */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 text-[12px] font-medium text-amber-700 py-4 px-4 bg-amber-50 rounded-[var(--radius-sm)] border border-amber-200"
                  >
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>
                      {t('auth.setPasswordExplanation', {
                        defaultValue: 'به دلیل محدودیت‌های ارسال پیامک، لطفاً یک رمز عبور برای حساب خود تنظیم کنید.'
                      })}
                    </span>
                  </motion.div>

                  {/* Phone Display (subtle) */}
                  <div className="flex items-center justify-center gap-2 text-[13px] text-black/50">
                    <Phone size={14} />
                    <span dir="ltr" className="font-medium">{phone}</span>
                    <button
                      type="button"
                      onClick={handleChangePhone}
                      disabled={isLoading}
                      className="text-black/40 hover:text-black underline disabled:opacity-50"
                    >
                      {t('common.edit')}
                    </button>
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
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
                        <span>{t('auth.setPasswordButton', { defaultValue: 'تنظیم رمز عبور و ورود' })}</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Register (New User) */}
              {/* ============================================================ */}
              {step === "register" && (
                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Phone Display (subtle) */}
                  <div className="flex items-center justify-center gap-2 text-[13px] text-black/50">
                    <Phone size={14} />
                    <span dir="ltr" className="font-medium">{phone}</span>
                    <button
                      type="button"
                      onClick={handleChangePhone}
                      disabled={isLoading}
                      className="text-black/40 hover:text-black underline disabled:opacity-50"
                    >
                      {t('common.edit')}
                    </button>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.name', { defaultValue: 'نام و نام خانوادگی' })}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('auth.namePlaceholder', { defaultValue: 'نام خود را وارد کنید' })}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 px-4 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[16px] font-medium text-center"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
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
                        <span>{t('auth.registerButton', { defaultValue: 'ثبت‌نام' })}</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Reset Password - Request OTP */}
              {/* ============================================================ */}
              {step === "reset-otp" && (
                <form onSubmit={handleSendResetOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.phoneNumber')}
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
                        <span>{t('auth.getOtp')}</span>
                        <ArrowLeft size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ============================================================ */}
              {/* STEP: Reset Password - Enter OTP & New Password */}
              {/* ============================================================ */}
              {step === "reset-password" && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* OTP Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.otp')}
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9۰-۹٠-٩]/g, "");
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

                    {/* Countdown/Resend */}
                    <div className="flex justify-between px-1">
                      <button
                        type="button"
                        onClick={handleChangePhone}
                        disabled={isLoading}
                        className="text-[11px] font-bold text-black/40 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {t('common.edit')}
                      </button>
                      <span className="text-[11px] font-bold text-black/40">
                        {countdown > 0 ? (
                          `${Math.floor(countdown / 60)}:${(countdown % 60)
                            .toString()
                            .padStart(2, "0")}`
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendResetOtp}
                            disabled={isLoading}
                            className="text-black hover:underline disabled:opacity-50"
                          >
                            {t('auth.resendOtp')}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* New Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.newPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] px-1">
                      {t('auth.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError(null);
                        }}
                        required
                        disabled={isLoading}
                        className="w-full h-14 pr-12 pl-12 bg-white/20 border border-white/40 rounded-[var(--radius-sm)] focus:outline-none focus:bg-white/40 focus:border-white/60 transition-all duration-300 text-[18px] font-bold tracking-widest text-center"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
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
                        <span>{t('auth.changePassword')}</span>
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer Note - kept simple, could be translated later */}
            <p className="mt-10 text-[11px] text-center text-black/30 font-medium leading-relaxed">
              {t('auth.termsNotice', {
                defaultValue: 'با ورود به هُما، شما با تمامی قوانین حریم خصوصی و شرایط استفاده موافقت می‌کنید.'
              })}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AuthModal;
