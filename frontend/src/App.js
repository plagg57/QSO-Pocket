import { useState, useEffect } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/auth/LoginPage";
import RegisterPage from "@/components/auth/RegisterPage";
import ForgotPasswordPage from "@/components/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";
import Dashboard from "@/components/Dashboard";

// Initialize axios interceptors via config import
import "@/config";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "#121212", border: "1px solid #27272a", color: "#FAFAFA" } }} />
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, checking, serverWaking } = useAuth();
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState("login");

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token");
  const isResetPage = window.location.pathname === "/reset-password" || window.location.pathname.includes("reset-password");

  useEffect(() => {
    if (user === false && !isResetPage) setAuthMode("login");
  }, [user, isResetPage]);

  if (isResetPage && resetToken) {
    return <ResetPasswordPage token={resetToken} onDone={() => { window.history.replaceState({}, "", "/"); setAuthMode("login"); window.location.reload(); }} />;
  }

  if (checking || serverWaking) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="radio-bg"></div>
        <div className="relative z-10 text-center">
          <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
          <p className="mt-4 text-zinc-500 font-mono text-sm">
            {serverWaking ? t("auth.server_waking") : t("auth.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === "forgot") return <ForgotPasswordPage onBack={() => setAuthMode("login")} />;
    if (authMode === "register") return <RegisterPage onSwitch={() => setAuthMode("login")} />;
    return <LoginPage onSwitch={() => setAuthMode("register")} onForgot={() => setAuthMode("forgot")} />;
  }

  return <Dashboard />;
}

export default App;
