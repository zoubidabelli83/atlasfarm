"use client";
import React, { useState } from "react";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";

type TimeRange = "24h" | "7d" | "30d";

function generateData(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      label: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      temp: +(20 + Math.sin(i * 0.5) * 5 + Math.random() * 2).toFixed(1),
      humidity: +(65 + Math.cos(i * 0.4) * 10 + Math.random() * 3).toFixed(1),
      moisture: +(45 + Math.cos(i * 0.3) * 15 + Math.random() * 4).toFixed(1),
      ph: +(6.4 + Math.sin(i * 0.15) * 0.4 + Math.random() * 0.15).toFixed(2),
      light: +(40000 + Math.sin(i * 0.7) * 15000 + Math.random() * 5000).toFixed(0),
      water: +(80 - i * 0.4 + Math.random() * 3).toFixed(1),
    };
  });
}

function generate24h() {
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (23 - i));
    const hour = d.getHours();
    const daylight = hour >= 6 && hour <= 20;
    return {
      label: d.toLocaleTimeString("en", { hour: "2-digit" }),
      light: daylight ? +(20000 + Math.sin((hour - 6) * 0.25) * 35000 + Math.random() * 5000).toFixed(0) : +(500 + Math.random() * 200).toFixed(0),
      moisture: +(45 - i * 0.2 + Math.random() * 2).toFixed(1),
      ph: +(6.4 + Math.sin(i * 0.1) * 0.2 + Math.random() * 0.1).toFixed(2),
      water: +(80 - i * 0.15 + Math.random() * 1.5).toFixed(1),
      temp: +(18 + Math.sin((i - 4) * 0.26) * 7 + Math.random() * 1.5).toFixed(1),
    };
  });
}

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
  color: string;
}

function StatCard({ label, value, unit, trend, color }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <div className="bg-white rounded-xl p-4 border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1 mt-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>
      </div>
      <TrendIcon className={`w-4 h-4 mt-1 ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-gray-400"}`} />
    </div>
  );
}

// ✅ Updated helper function: handles number | string | null | undefined from Recharts
const safeNumberFormatter = (
  value: number | string | null | undefined, 
  unit: string, 
  decimals = 2
): [string, string] => {
  const numValue = typeof value === 'number' ? value : Number(value);
  if (isNaN(numValue)) return ["N/A", unit];
  return [numValue.toFixed(decimals), unit];
};

export default function AnalyticsPage() {
  const { t } = useI18n();
  const { sensors } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  const data7d = generateData(7);
  const data30d = generateData(30);
  const data24h = generate24h();
  const chartData = timeRange === "24h" ? data24h : timeRange === "7d" ? data7d : data30d;

  const handleExportCSV = () => {
    const headers = ["Date", "Temp(°C)", "Moisture(%)", "pH", "Light(lux)", "Water(%)"];
    const rows = chartData.map((d) => [d.label, d.temp, d.moisture, d.ph, d.light, d.water]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlasfarm-sensors-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calcStats = (key: keyof typeof chartData[0]) => {
    const vals = chartData.map((d) => Number(d[key])).filter((v) => !isNaN(v));
    return {
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      min: Math.min(...vals).toFixed(1),
      max: Math.max(...vals).toFixed(1),
    };
  };

  const tempStats = calcStats("temp");
  const moistureStats = calcStats("moisture");
  const phStats = calcStats("ph");
  const waterStats = calcStats("water");

  // Correlation scatter data (moisture vs temp)
  const scatterData = chartData.map((d) => ({ x: d.temp, y: d.moisture }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("analytics")}</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
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
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground"
          >
            <Download className="w-4 h-4" />
            {t("exportCSV")}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-border col-span-2 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Temperature</p>
            <div className="flex gap-2">
              <StatCard label={t("average")} value={tempStats.avg} unit="°C" trend="stable" color="#f39c12" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("soilMoisture")}</p>
            <StatCard label={t("average")} value={moistureStats.avg} unit="%" trend="down" color="#7cb342" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("soilPH")}</p>
            <StatCard label={t("average")} value={phStats.avg} unit="pH" trend="stable" color="#9b59b6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("waterLevel")}</p>
            <StatCard label={t("average")} value={waterStats.avg} unit="%" trend="down" color="#3498db" />
          </div>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Temp Avg/Min/Max", avg: tempStats.avg, min: tempStats.min, max: tempStats.max, unit: "°C", color: "#f39c12" },
          { label: "Moisture Avg/Min/Max", avg: moistureStats.avg, min: moistureStats.min, max: moistureStats.max, unit: "%", color: "#7cb342" },
          { label: "pH Avg/Min/Max", avg: phStats.avg, min: phStats.min, max: phStats.max, unit: "pH", color: "#9b59b6" },
          { label: "Water Avg/Min/Max", avg: waterStats.avg, min: waterStats.min, max: waterStats.max, unit: "%", color: "#3498db" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-border">
            <p className="text-[11px] text-muted-foreground mb-2">{stat.label}</p>
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <p className="text-muted-foreground">Min</p>
                <p className="font-bold text-sm" style={{ color: stat.color }}>{stat.min}</p>
                <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Avg</p>
                <p className="font-bold text-lg" style={{ color: stat.color }}>{stat.avg}</p>
                <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Max</p>
                <p className="font-bold text-sm" style={{ color: stat.color }}>{stat.max}</p>
                <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* pH Trend Analysis */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">{t("phTrend")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9b59b6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9b59b6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[5, 9]} tick={{ fontSize: 10 }} />
            {/* ✅ Fixed: safeNumberFormatter handles all Recharts value types */}
            <Tooltip 
              contentStyle={{ fontSize: 12, borderRadius: 8 }} 
              formatter={(v) => safeNumberFormatter(v, "pH", 2)} 
            />
            <Area type="monotone" dataKey="ph" stroke="#9b59b6" fill="url(#phGrad)" strokeWidth={2} dot={false} name="pH" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Optimal (6.0–7.0)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> Slight Acidity (5.5–6.0)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Critical (&lt;5.5 or &gt;8)</span>
        </div>
      </div>

      {/* Light Patterns (day/night cycle) */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">{t("lightPattern")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data24h} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            {/* ✅ Fixed: inline formatter handles undefined/string values for lux */}
            <Tooltip 
              contentStyle={{ fontSize: 12, borderRadius: 8 }} 
              formatter={(v: number | string | null | undefined) => {
                const numValue = typeof v === 'number' ? v : Number(v);
                return [isNaN(numValue) ? "-" : `${(numValue / 1000).toFixed(1)}k lux`, "Light"];
              }} 
            />
            <Bar dataKey="light" fill="#f39c12" radius={[3, 3, 0, 0]} name="Light (lux)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Soil Moisture + Water Consumption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">{t("moistureTrend")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7cb342" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7cb342" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="moisture" stroke="#7cb342" fill="url(#moistGrad)" strokeWidth={2} dot={false} name="Moisture (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">{t("waterConsumption")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3498db" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3498db" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="water" stroke="#3498db" fill="url(#waterGrad)" strokeWidth={2} dot={false} name="Water Level (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">{t("correlation")}: Temperature vs Soil Moisture</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="x" name="Temp (°C)" tick={{ fontSize: 10 }} label={{ value: "Temperature (°C)", position: "insideBottom", offset: -5, fontSize: 11 }} />
            <YAxis dataKey="y" name="Moisture (%)" tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Scatter data={scatterData} fill="#7cb342" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-sensor line chart */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">{t("trends")} — All Sensors</h3>
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
    </div>
  );
}