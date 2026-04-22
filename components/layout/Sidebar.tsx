"use client";
import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Map,
  ClipboardList,
  Bell,
  Wrench,
  ShieldCheck,
  LogOut,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { signOut } from "@/app/actions/users";
import { useRouter } from "next/navigation";

const ALL_NAV_ITEMS = [
  { key: "dashboard", icon: LayoutDashboard, labelKey: "dashboard", roles: ["admin","manager","agronomist","farmer"] },
  { key: "analytics", icon: BarChart3, labelKey: "analytics", roles: ["admin","manager","agronomist"] },
  { key: "fields", icon: Map, labelKey: "fieldMaps", roles: ["admin","manager","agronomist","farmer"] },
  { key: "tasks", icon: ClipboardList, labelKey: "tasks", roles: ["admin","manager","agronomist","farmer"] },
  { key: "alerts", icon: Bell, labelKey: "alerts", roles: ["admin","manager","agronomist"] },
  { key: "calibration", icon: Wrench, labelKey: "sensorCalibration", roles: ["admin","agronomist"] },
  { key: "admin", icon: ShieldCheck, labelKey: "admin", roles: ["admin"] },
];

export default function Sidebar() {
  const { t, isRTL } = useI18n();
  const { sidebarOpen, setSidebarOpen, activeSection, setActiveSection, unreadAlertCount, currentUser } = useApp();
  const router = useRouter();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !currentUser || item.roles.includes(currentUser.role)
  );

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 z-30 h-full flex flex-col sidebar-gradient transition-all duration-300 shadow-2xl
          ${isRTL ? "right-0" : "left-0"}
          ${sidebarOpen ? "w-64" : "w-16"}
          ${!sidebarOpen && "lg:flex hidden"}
          lg:relative lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[oklch(0.35_0.07_145)]">
          <div className="w-9 h-9 rounded-lg bg-[#7cb342] flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="text-white font-bold text-lg leading-none block">AtlasFarm</span>
              <span className="text-[oklch(0.7_0.08_145)] text-xs">IoT Platform</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`
                sidebar-nav-item w-full text-[oklch(0.8_0.04_145)]
                ${activeSection === key ? "active" : ""}
                ${!sidebarOpen ? "justify-center px-2" : ""}
                ${isRTL ? "flex-row-reverse" : ""}
              `}
              title={!sidebarOpen ? t(labelKey) : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {key === "alerts" && unreadAlertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#e74c3c] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadAlertCount}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <span className="truncate">{t(labelKey)}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: Logout */}
        <div className="px-2 py-4 border-t border-[oklch(0.35_0.07_145)]">
          <button
            onClick={handleSignOut}
            className={`
              sidebar-nav-item w-full text-[oklch(0.8_0.04_145)] hover:text-red-400
              ${!sidebarOpen ? "justify-center px-2" : ""}
              ${isRTL ? "flex-row-reverse" : ""}
            `}
            title={!sidebarOpen ? t("logout") : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{t("logout")}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`
            hidden lg:flex absolute top-1/2 -translate-y-1/2 w-6 h-12 items-center justify-center
            bg-[#4a7c43] text-white rounded-full shadow-lg z-10 transition-all
            ${isRTL ? "-left-3" : "-right-3"}
          `}
        >
          {isRTL
            ? sidebarOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />
            : sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          }
        </button>
      </aside>
    </>
  );
}
