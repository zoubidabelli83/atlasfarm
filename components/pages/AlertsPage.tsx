"use client";
import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Settings2,
  FileDown,
  Filter,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";

export default function AlertsPage() {
  const { t } = useI18n();
  const { alerts, thresholds, acknowledgeAlert, resolveAlert, updateThreshold, toggleThreshold } = useApp();
  const [view, setView] = useState<"active" | "history" | "config">("active");
  const [expandedThreshold, setExpandedThreshold] = useState<string | null>(null);

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const historyAlerts = alerts.filter((a) => a.resolved);

  const severityConfig = {
    critical: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700" },
    warning: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700" },
  };

  const sensorLabels: Record<string, string> = {
    airTemperature: t("airTemperature"),
    airHumidity: t("airHumidity"),
    soilMoisture: t("soilMoisture"),
    soilPH: t("soilPH"),
    lightIntensity: t("lightIntensity"),
    waterLevel: t("waterLevel"),
  };

  const sensorUnits: Record<string, string> = {
    airTemperature: "°C",
    airHumidity: "%",
    soilMoisture: "%",
    soilPH: "pH",
    lightIntensity: "lux",
    waterLevel: "%",
  };

  const handleExportPDF = () => {
    // Mock PDF export
    const content = alerts.map((a) =>
      `[${a.severity.toUpperCase()}] ${new Date(a.timestamp).toLocaleString()} - ${a.message}`
    ).join("\n");
    const blob = new Blob([`AtlasFarm Alert Report\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a2 = document.createElement("a");
    a2.href = url;
    a2.download = "atlasfarm-alert-report.txt";
    a2.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ${t("ago")}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ${t("ago")}`;
    return `${Math.floor(diffH / 24)}d ${t("ago")}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{t("alertSystem")}</h1>
          {activeAlerts.filter((a) => !a.acknowledged).length > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              {activeAlerts.filter((a) => !a.acknowledged).length} new
            </span>
          )}
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground self-start"
        >
          <FileDown className="w-4 h-4" />
          {t("generateReport")}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: "active", label: t("activeAlerts"), count: activeAlerts.length },
          { key: "history", label: t("alertHistory"), count: historyAlerts.length },
          { key: "config", label: t("configureThresholds") },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as typeof view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${view === tab.key ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${view === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active alerts */}
      {view === "active" && (
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#7cb342] mx-auto mb-3" />
              <p className="font-medium text-foreground">{t("noActiveAlerts")}</p>
              <p className="text-sm text-muted-foreground mt-1">All sensor readings are within normal thresholds</p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const sev = severityConfig[alert.severity];
              const SevIcon = sev.icon;
              return (
                <div key={alert.id} className={`bg-white rounded-xl border p-4 ${sev.bg} ${!alert.acknowledged ? "ring-2 ring-offset-1 ring-current ring-opacity-20" : ""}`}>
                  <div className="flex items-start gap-3">
                    <SevIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${sev.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${sev.badge}`}>{alert.severity}</span>
                        <span className="text-xs font-semibold text-foreground">{sensorLabels[alert.sensorKey]}</span>
                        {!alert.acknowledged && (
                          <span className="px-1.5 py-0.5 bg-white border border-border rounded text-[9px] font-bold text-muted-foreground uppercase">New</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1.5 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Value: <strong>{alert.value}</strong></span>
                        <span>Threshold: <strong>{alert.threshold}</strong></span>
                        <span>{formatTime(alert.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
                        >
                          {t("acknowledge")}
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1 bg-white border border-border rounded-lg text-xs font-medium hover:bg-muted text-foreground"
                      >
                        {t("resolve")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History */}
      {view === "history" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{t("severity")}</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Sensor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Message</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{t("date")}</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {[...activeAlerts, ...historyAlerts].map((alert) => {
                const sev = severityConfig[alert.severity];
                const SevIcon = sev.icon;
                return (
                  <tr key={alert.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <SevIcon className={`w-4 h-4 ${sev.color}`} />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.badge}`}>{alert.severity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{sensorLabels[alert.sensorKey]}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">{alert.message}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(alert.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${alert.resolved ? "bg-green-100 text-green-700" : alert.acknowledged ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {alert.resolved ? "Resolved" : alert.acknowledged ? "Acknowledged" : "New"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Threshold configuration */}
      {view === "config" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("configureThresholds")} — alerts trigger when readings go outside these ranges.</p>
          {thresholds.map((threshold) => (
            <div key={threshold.sensorKey} className="bg-white rounded-xl border border-border overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedThreshold(expandedThreshold === threshold.sensorKey ? null : threshold.sensorKey)}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleThreshold(threshold.sensorKey); }}
                    className="flex-shrink-0"
                  >
                    {threshold.enabled
                      ? <ToggleRight className="w-5 h-5 text-[#7cb342]" />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                  <div className="text-left">
                    <p className="font-medium text-foreground text-sm">{sensorLabels[threshold.sensorKey]}</p>
                    <p className="text-xs text-muted-foreground">
                      Range: {threshold.minValue} – {threshold.maxValue} {sensorUnits[threshold.sensorKey]}
                    </p>
                  </div>
                </div>
                {expandedThreshold === threshold.sensorKey
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>
              {expandedThreshold === threshold.sensorKey && (
                <div className="px-5 pb-5 pt-2 border-t border-border bg-muted/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("minValue")} ({sensorUnits[threshold.sensorKey]})
                      </label>
                      <input
                        type="number"
                        value={threshold.minValue}
                        onChange={(e) => updateThreshold(threshold.sensorKey, "minValue", parseFloat(e.target.value))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {t("maxValue")} ({sensorUnits[threshold.sensorKey]})
                      </label>
                      <input
                        type="number"
                        value={threshold.maxValue}
                        onChange={(e) => updateThreshold(threshold.sensorKey, "maxValue", parseFloat(e.target.value))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">
                      Alert severity levels: 
                      <span className="text-blue-600 font-medium"> Info</span> (5% outside range),
                      <span className="text-orange-600 font-medium"> Warning</span> (10% outside range),
                      <span className="text-red-600 font-medium"> Critical</span> (20%+ outside range)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
