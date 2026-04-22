"use client";
import React from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { useApp } from "@/contexts/app-context";
import { useI18n } from "@/contexts/i18n-context";

// Page imports
import DashboardPage from "@/components/pages/DashboardPage";
import AnalyticsPage from "@/components/pages/AnalyticsPage";
import FieldMapPage from "@/components/pages/FieldMapPage";
import TasksPage from "@/components/pages/TasksPage";
import AlertsPage from "@/components/pages/AlertsPage";
import CalibrationPage from "@/components/pages/CalibrationPage";
import AdminPage from "@/components/pages/AdminPage";
import PlotsPage from "@/components/pages/PlotsPage";

const PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  analytics: AnalyticsPage,
  fields: FieldMapPage,
  plots: PlotsPage,
  tasks: TasksPage,
  alerts: AlertsPage,
  calibration: CalibrationPage,
  admin: AdminPage,
};

export default function AppShell() {
  const { activeSection, sidebarOpen } = useApp();
  const { isRTL } = useI18n();
  const PageComponent = PAGES[activeSection] || DashboardPage;

  return (
    <div className={`flex h-screen overflow-hidden bg-background ${isRTL ? "flex-row-reverse" : ""}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 page-enter scrollbar-thin">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}
