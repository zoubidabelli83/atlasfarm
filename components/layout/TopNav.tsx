"use client";
import React, { useState } from "react";
import {
  Bell,
  Settings,
  Menu,
  User,
  ChevronDown,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { Locale } from "@/lib/translations";
import { signOut } from "@/app/actions/users";
import { useRouter } from "next/navigation";

const LANG_LABELS: Record<Locale, string> = { en: "EN", fr: "FR", ar: "AR" };
const LANG_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export default function TopNav() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { setSidebarOpen, sidebarOpen, alerts, unreadAlertCount, acknowledgeAlert, currentUser, setActiveSection } = useApp();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const recentAlerts = alerts.filter((a) => !a.resolved).slice(0, 5);

  const sectionTitles: Record<string, string> = {
    dashboard: t("dashboard"),
    analytics: t("analytics"),
    fields: t("fieldMaps"),
    tasks: t("tasks"),
    alerts: t("alerts"),
    calibration: t("sensorCalibration"),
    admin: t("admin"),
  };

  const severityIcon = (s: string) => {
    if (s === "critical") return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    if (s === "warning") return <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />;
    return <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-4 gap-3 sticky top-0 z-10 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo text on mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <span className="font-bold text-primary text-lg">AtlasFarm</span>
      </div>

      <div className="flex-1" />

      {/* Language switcher */}
      <div className="relative">
        <button
          onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span>{LANG_LABELS[locale]}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {langOpen && (
          <div className={`absolute top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-border py-1 z-50 ${isRTL ? "left-0" : "right-0"}`}>
            {(["en", "fr", "ar"] as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => { setLocale(lang); setLangOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center justify-between gap-2 ${locale === lang ? "text-primary font-medium" : "text-foreground"}`}
              >
                <span>{LANG_NAMES[lang]}</span>
                {locale === lang && <CheckCircle className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setLangOpen(false); setUserOpen(false); }}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          aria-label={t("notifications")}
        >
          <Bell className="w-5 h-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#e74c3c] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadAlertCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className={`absolute top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-border z-50 ${isRTL ? "left-0" : "right-0"}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground">{t("notifications")}</span>
              <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">{t("noActiveAlerts")}</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className={`px-4 py-3 border-b border-border/50 hover:bg-muted/50 ${!alert.acknowledged ? "bg-blue-50/50" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      {severityIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[10px] text-primary hover:underline flex-shrink-0"
                        >
                          ACK
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings — navigates to admin panel for admins, hidden for other roles */}
      {currentUser?.role === "admin" && (
        <button
          onClick={() => { setActiveSection("admin"); setLangOpen(false); setNotifOpen(false); setUserOpen(false); }}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          aria-label={t("settings")}
          title={t("admin")}
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* User avatar */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); setLangOpen(false); setNotifOpen(false); }}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-foreground leading-none">
              {currentUser?.name ?? "User"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
              {currentUser?.role ?? ""}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
        </button>
        {userOpen && (
          <div className={`absolute top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-border py-1 z-50 ${isRTL ? "left-0" : "right-0"}`}>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{currentUser?.name ?? "User"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{currentUser?.email ?? ""}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold capitalize">
                {currentUser?.role ?? ""}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium transition-colors disabled:opacity-50"
            >
              {signingOut ? "..." : t("logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
