import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../../context/AppProviders";

/**
 * LoginPage - User authentication page
 * Uses new AuthContext for login/logout
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = () => {
    // Simulate login with mock user
    login({
      id: `user_${Date.now()}`,
      name: 'کاربر هُما',
      phone: '۰۹۱۲۰۰۰۰۰۰۰',
    });
    navigate(-1); // Go back to where they were
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
            <User size={32} strokeWidth={1.5} />
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
            onClick={handleLogin}
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
    </div>
  );
}
