"use client";
import React from "react";
import {
  Thermometer,
  Droplets,
  Sprout,
  FlaskConical,
  Sun,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { SensorData } from "@/lib/mock-data";

const SENSOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  airTemperature: Thermometer,
  airHumidity: Droplets,
  soilMoisture: Sprout,
  soilPH: FlaskConical,
  lightIntensity: Sun,
  waterLevel: Gauge,
};

const SENSOR_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  airTemperature: { bg: "bg-orange-50", icon: "text-orange-500", border: "border-orange-200" },
  airHumidity: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-200" },
  soilMoisture: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  soilPH: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
  lightIntensity: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-200" },
  waterLevel: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200" },
};

interface SensorCardProps {
  sensor: SensorData;
}

export default function SensorCard({ sensor }: SensorCardProps) {
  const { t } = useI18n();
  const Icon = SENSOR_ICONS[sensor.name] || Gauge;
  const colors = SENSOR_COLORS[sensor.name] || { bg: "bg-gray-50", icon: "text-gray-500", border: "border-gray-200" };

  const statusClass =
    sensor.status === "optimal"
      ? "status-optimal"
      : sensor.status === "warning"
      ? "status-warning"
      : "status-critical";

  const statusLabel =
    sensor.status === "optimal"
      ? t("optimal")
      : sensor.status === "warning"
      ? t("warning")
      : t("critical");

  const TrendIcon =
    sensor.trend === "up" ? TrendingUp : sensor.trend === "down" ? TrendingDown : Minus;

  const trendColor =
    sensor.trend === "up"
      ? "text-emerald-500"
      : sensor.trend === "down"
      ? "text-red-400"
      : "text-gray-400";

  // Progress for visual gauge
  const progress =
    sensor.name === "soilPH"
      ? ((sensor.value - 0) / 14) * 100
      : Math.min(((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100, 100);

  const progressColor =
    sensor.status === "optimal"
      ? "bg-[#7cb342]"
      : sensor.status === "warning"
      ? "bg-[#f39c12]"
      : "bg-[#e74c3c]";

  const displayValue =
    sensor.name === "lightIntensity"
      ? sensor.value >= 1000
        ? `${(sensor.value / 1000).toFixed(1)}k`
        : sensor.value.toString()
      : sensor.name === "soilPH"
      ? sensor.value.toFixed(1)
      : Math.round(sensor.value).toString();

  return (
    <div className="sensor-card group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="mb-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {t(sensor.name)}
        </p>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-foreground">{displayValue}</span>
        <span className="text-base text-muted-foreground mb-0.5">{sensor.unit}</span>
        <TrendIcon className={`w-4 h-4 ${trendColor} mb-1 ml-auto`} />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(2, progress)}%` }}
        />
      </div>

      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
        <span>{sensor.min}{sensor.unit}</span>
        <span>{sensor.max}{sensor.unit}</span>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7cb342] live-indicator" />
        <span className="text-[10px] text-muted-foreground">{t("online")} — {t("lastUpdate")} 2s</span>
      </div>
    </div>
  );
}
