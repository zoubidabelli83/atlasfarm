"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, Globe, AlertCircle } from "lucide-react";

type Lang = "en" | "fr" | "ar";

const t: Record<Lang, Record<string, string>> = {
  en: {
    welcome: "Welcome to AtlasFarm",
    subtitle: "Algerian Agricultural IoT Management Platform",
    email: "Email address",
    password: "Password",
    signin: "Sign in",
    signing: "Signing in...",
    error_invalid: "Invalid email or password.",
    error_inactive: "Your account is inactive. Please contact the administrator.",
    error_generic: "An error occurred. Please try again.",
    forgot: "Contact your administrator to reset your password.",
  },
  fr: {
    welcome: "Bienvenue sur AtlasFarm",
    subtitle: "Plateforme algérienne de gestion IoT agricole",
    email: "Adresse e-mail",
    password: "Mot de passe",
    signin: "Se connecter",
    signing: "Connexion...",
    error_invalid: "E-mail ou mot de passe incorrect.",
    error_inactive: "Votre compte est inactif. Veuillez contacter l'administrateur.",
    error_generic: "Une erreur est survenue. Veuillez réessayer.",
    forgot: "Contactez votre administrateur pour réinitialiser votre mot de passe.",
  },
  ar: {
    welcome: "مرحباً بك في AtlasFarm",
    subtitle: "منصة الجزائر لإدارة إنترنت الأشياء الزراعية",
    email: "عنوان البريد الإلكتروني",
    password: "كلمة المرور",
    signin: "تسجيل الدخول",
    signing: "جارٍ تسجيل الدخول...",
    error_invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    error_inactive: "حسابك غير نشط. يرجى التواصل مع المسؤول.",
    error_generic: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    forgot: "تواصل مع المسؤول لإعادة تعيين كلمة المرور.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("fr");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRtl = lang === "ar";
  const tx = t[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError(tx.error_invalid);
      setLoading(false);
      return;
    }

    // Fetch the profile to check status and set language preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("status, language, role")
      .eq("id", data.user.id)
      .single();

    if (profile?.status === "inactive") {
      await supabase.auth.signOut();
      setError(tx.error_inactive);
      setLoading(false);
      return;
    }

    // Update last_login timestamp
    await supabase.rpc("update_last_login", { user_id: data.user.id });

    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-[42%] relative overflow-hidden"
        style={{ backgroundColor: "#2d5a27" }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, #7cb342 0%, transparent 60%), radial-gradient(circle at 80% 20%, #4a7c43 0%, transparent 50%)",
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">
            AtlasFarm
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#7cb342]" />
              6 capteurs IoT temps réel
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#7cb342]" />
              Étalonnage pH, humidité, lumière, eau
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#7cb342]" />
              Cartographie des champs (Leaflet)
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="w-2 h-2 rounded-full bg-[#7cb342]" />
              Interface trilingue (FR / EN / AR)
            </div>
          </div>

          <blockquote className="border-l-2 border-[#7cb342] pl-4">
            <p className="text-white/90 text-base font-medium leading-relaxed">
              &ldquo;La technologie au service de l&apos;agriculture algérienne.&rdquo;
            </p>
          </blockquote>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} AtlasFarm — Algérie
          </p>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        {/* Language switcher */}
        <div
          className={`absolute top-6 ${isRtl ? "left-6" : "right-6"} flex items-center gap-1 bg-white border border-border rounded-xl p-1 shadow-sm`}
        >
          <Globe className="w-3.5 h-3.5 text-muted-foreground mx-1" />
          {(["en", "fr", "ar"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l === "en" ? "EN" : l === "fr" ? "FR" : "عربية"}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#2d5a27" }}
            >
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">AtlasFarm</span>
          </div>

          {/* Heading */}
          <div className={`space-y-1 ${isRtl ? "text-right" : ""}`}>
            <h1 className="text-2xl font-bold text-foreground">{tx.welcome}</h1>
            <p className="text-sm text-muted-foreground">{tx.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                className={`block text-xs font-semibold text-muted-foreground uppercase tracking-wide ${isRtl ? "text-right" : ""}`}
              >
                {tx.email}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir={isRtl ? "rtl" : "ltr"}
                className={`w-full px-4 py-3 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground ${isRtl ? "text-right" : ""}`}
                placeholder={tx.email}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className={`block text-xs font-semibold text-muted-foreground uppercase tracking-wide ${isRtl ? "text-right" : ""}`}
              >
                {tx.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className={`w-full px-4 py-3 border border-border rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isRtl ? "pr-4 pl-11" : "pr-11"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-3" : "right-3"} p-1 text-muted-foreground hover:text-foreground transition-colors`}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              {loading ? tx.signing : tx.signin}
            </button>
          </form>

          {/* Forgot password note */}
          <p
            className={`text-xs text-muted-foreground text-center leading-relaxed ${isRtl ? "text-right" : ""}`}
          >
            {tx.forgot}
          </p>
        </div>
      </div>
    </div>
  );
}
