import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AppProviders";
import { AuthModal } from "../../components/AuthModal";
import { getAndClearAuthRedirect } from "../../components/ProtectedRoute";
import type { User, AuthTokens } from "../../types/auth";

/**
 * LoginPage - User authentication page
 * Shows AuthModal for OTP-based login
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (isLoggedIn) {
      const redirectPath = getAndClearAuthRedirect();
      navigate(redirectPath || "/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleAuthSuccess = (user: User, tokens: AuthTokens) => {
    login(user, tokens);
    setIsAuthModalOpen(false);

    // Redirect to intended destination or home
    const redirectPath = getAndClearAuthRedirect();
    navigate(redirectPath || "/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface-page">
      <div
        className="w-full max-w-md p-10 rounded-2xl text-center space-y-8"
        style={{
          background: "var(--color-surface-default)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(227, 30, 36, 0.1)",
              color: "var(--color-brand-primary)",
            }}
          >
            <UserIcon size={32} strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-3">
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--color-content-primary)" }}
          >
            ورود به هُما
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: "var(--color-content-secondary)" }}
          >
            برای ذخیره نتایج Try-On و دسترسی به گالری و پروژه‌ها وارد شوید.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full h-14 rounded-2xl font-bold transition-transform active:scale-95"
            style={{
              background: "var(--color-brand-primary)",
              color: "var(--color-content-inverse)",
              boxShadow: "0 4px 16px rgba(227, 30, 36, 0.2)",
            }}
          >
            ورود / ثبت‌نام
          </button>

          <button
            onClick={() => navigate(-1)}
            className="text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: "var(--color-content-secondary)" }}
          >
            بعداً
          </button>
        </div>

        <p
          className="text-xs"
          style={{ color: "var(--color-content-muted)" }}
        >
          ورود کمتر از یک دقیقه زمان می‌برد.
        </p>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
