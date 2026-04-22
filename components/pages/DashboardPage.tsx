"use client";
import React, { useEffect, useState } from "react";
import {
  Droplets,
  Zap,
  Eye,
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  CheckCircle2,
  Clock,
  AlertCircle,
  Leaf,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import SensorCard from "@/components/sensors/SensorCard";
import { mockWeather, mockTasks } from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloud: Cloud,
  "cloud-rain": CloudRain,
  "cloud-sun": Sun,
};

type TimeRange = "24h" | "7d" | "30d";

function buildChartData(timeRange: TimeRange, sensors: ReturnType<typeof useApp>["sensors"]) {
  const points = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
  return Array.from({ length: points }, (_, i) => {
    const d = new Date();
    if (timeRange === "24h") {
      d.setHours(d.getHours() - (points - 1 - i));
      return {
        label: d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }),
        temp: +(22 + Math.sin(i * 0.4) * 4 + Math.random() * 1.5).toFixed(1),
        moisture: +(40 + Math.cos(i * 0.3) * 12 + Math.random() * 3).toFixed(1),
        ph: +(6.4 + Math.sin(i * 0.1) * 0.3 + Math.random() * 0.1).toFixed(2),
        water: +(80 - i * 0.3 + Math.random() * 2).toFixed(1),
      };
    } else {
      d.setDate(d.getDate() - (points - 1 - i));
      return {
        label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        temp: +(22 + Math.sin(i * 0.5) * 5 + Math.random() * 2).toFixed(1),
        moisture: +(45 + Math.cos(i * 0.4) * 15 + Math.random() * 4).toFixed(1),
        ph: +(6.4 + Math.sin(i * 0.15) * 0.4 + Math.random() * 0.15).toFixed(2),
        water: +(80 - i * 0.4 + Math.random() * 3).toFixed(1),
      };
    }
  });
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { sensors, alerts, setActiveSection, currentUser } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [currentDateText, setCurrentDateText] = useState("");
  const [lastUpdateText, setLastUpdateText] = useState("");
  const chartData = buildChartData(timeRange, sensors);

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateText(
        new Date().toLocaleDateString("en", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setLastUpdateText(new Date().toLocaleTimeString());
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTasks = mockTasks.filter((task) => task.status !== "completed").slice(0, 4);
  const activeAlerts = alerts.filter((a) => !a.resolved);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  const sensorHealthAll = sensors.every((s) => s.status !== "critical");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("welcomeBack")}, {currentUser?.name?.split(" ")[0] ?? ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {currentDateText || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSection("calibration")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            {t("calibrateSensor")}
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Droplets className="w-4 h-4" />
            {t("irrigateNow")}
          </button>
          <button
            onClick={() => setActiveSection("analytics")}
            className="flex items-center gap-2 px-4 py-2 bg-[#3498db] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Eye className="w-4 h-4" />
            {t("viewAnalytics")}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl px-4 py-3 border border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-[#7cb342]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Active Plots</p>
            <p className="text-lg font-bold text-foreground">3</p>
          </div>
        </div>
        <div className="bg-white rounded-xl px-4 py-3 border border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#3498db]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("activeTasks")}</p>
            <p className="text-lg font-bold text-foreground">{activeTasks.length}</p>
          </div>
        </div>
        <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${criticalCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-border"}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${criticalCount > 0 ? "bg-red-100" : "bg-orange-50"}`}>
            <AlertCircle className={`w-4 h-4 ${criticalCount > 0 ? "text-red-500" : "text-orange-500"}`} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("alerts")}</p>
            <p className={`text-lg font-bold ${criticalCount > 0 ? "text-red-600" : "text-foreground"}`}>
              {criticalCount}C / {warningCount}W
            </p>
          </div>
        </div>
        <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${sensorHealthAll ? "bg-white border-border" : "bg-orange-50 border-orange-200"}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sensorHealthAll ? "bg-green-50" : "bg-orange-100"}`}>
            <CheckCircle2 className={`w-4 h-4 ${sensorHealthAll ? "text-[#7cb342]" : "text-orange-500"}`} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">{t("sensorHealth")}</p>
            <p className="text-lg font-bold text-foreground">{sensorHealthAll ? t("normal") : t("warning")}</p>
          </div>
        </div>
      </div>

      {/* 6 Sensor KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7cb342] live-indicator" />
            {t("realTimeSensors")}
          </h2>
          <span className="text-xs text-muted-foreground">{t("lastUpdate")}: {lastUpdateText || "--:--:--"}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      </section>

      {/* Chart + Weather row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h3 className="font-semibold text-foreground">{t("trends")}</h3>
            <div className="flex gap-1.5 bg-muted p-1 rounded-lg">
              {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${timeRange === r ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {r === "24h" ? t("last24h") : r === "7d" ? t("last7d") : t("last30d")}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="temp" stroke="#f39c12" strokeWidth={2} dot={false} name="Temp (°C)" />
              <Line type="monotone" dataKey="moisture" stroke="#7cb342" strokeWidth={2} dot={false} name="Moisture (%)" />
              <Line type="monotone" dataKey="ph" stroke="#9b59b6" strokeWidth={2} dot={false} name="pH" />
              <Line type="monotone" dataKey="water" stroke="#3498db" strokeWidth={2} dot={false} name="Water (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Weather */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">{t("weatherForecast")}</h3>
          <div className="space-y-2">
            {mockWeather.map((day, idx) => {
              const WIcon = WEATHER_ICONS[day.icon] || Sun;
              return (
                <div key={idx} className={`flex items-center gap-3 px-2 py-2 rounded-lg ${idx === 0 ? "bg-primary/5 border border-primary/20" : "hover:bg-muted"}`}>
                  <span className="text-xs font-semibold text-muted-foreground w-8">{day.day}</span>
                  <WIcon className={`w-4 h-4 flex-shrink-0 ${day.icon === "cloud-rain" ? "text-blue-400" : day.icon === "sun" ? "text-yellow-500" : "text-gray-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#3498db] rounded-full" style={{ width: `${day.precipitation}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{day.precipitation}%</span>
                  <span className="text-xs font-semibold text-foreground">{day.tempHigh}°</span>
                  <span className="text-xs text-muted-foreground">{day.tempLow}°</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <Wind className="w-3.5 h-3.5" />
            <span>Casablanca, Morocco</span>
          </div>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">{t("activeTasks")}</h3>
          <button
            onClick={() => setActiveSection("tasks")}
            className="text-primary text-sm hover:underline font-medium"
          >
            {t("view")} all
          </button>
        </div>
        <div className="space-y-2">
          {activeTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === "high" ? "bg-[#e74c3c]" : task.priority === "medium" ? "bg-[#f39c12]" : "bg-[#7cb342]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
                <p className="text-[11px] text-muted-foreground">{task.plotName} — {task.assignedTo}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.isRecommendation && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">AI</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${task.status === "inProgress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                  {task.status === "inProgress" ? t("inProgress") : t("pending")}
                </span>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{task.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
