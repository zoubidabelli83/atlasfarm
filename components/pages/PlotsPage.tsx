"use client";
import React, { useState } from "react";
import {
  Plus,
  MapPin,
  Leaf,
  Ruler,
  Calendar,
  Droplets,
  FlaskConical,
  X,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { Plot } from "@/lib/mock-data";

const CROP_TYPES = ["Wheat", "Tomatoes", "Olive Trees", "Barley", "Corn", "Sunflower", "Citrus", "Pepper"];
const SOIL_TYPES = ["Loamy", "Sandy Loam", "Clay", "Silty", "Sandy", "Peat", "Chalky"];
const CROP_COLORS: Record<string, string> = {
  Wheat: "#f39c12",
  Tomatoes: "#e74c3c",
  "Olive Trees": "#7cb342",
  Barley: "#e67e22",
  Corn: "#f1c40f",
  Sunflower: "#f39c12",
  Citrus: "#e67e22",
  Pepper: "#e74c3c",
};

function PlotFormModal({
  plot,
  onClose,
  onSave,
}: {
  plot?: Plot;
  onClose: () => void;
  onSave: (data: Partial<Plot>) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: plot?.name ?? "",
    cropType: plot?.cropType ?? "Wheat",
    area: plot?.area?.toString() ?? "10",
    soilType: plot?.soilType ?? "Loamy",
    sowingDate: plot?.sowingDate ?? new Date().toISOString().split("T")[0],
    status: plot?.status ?? "active",
    irrigationSchedule: plot?.irrigationSchedule ?? "Daily 06:00",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      area: parseFloat(form.area),
      color: CROP_COLORS[form.cropType] ?? "#7cb342",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">
            {plot ? t("editPlot") : t("addPlot")}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("fieldName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              placeholder="e.g. North Field A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("cropType")}</label>
              <select
                value={form.cropType}
                onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              >
                {CROP_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("area")} (ha)</label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
                min="0.1"
                step="0.1"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("soilType")}</label>
              <select
                value={form.soilType}
                onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              >
                {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("sowingDate")}</label>
              <input
                type="date"
                value={form.sowingDate}
                onChange={(e) => setForm({ ...form, sowingDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("irrigationSystem")}</label>
            <input
              value={form.irrigationSchedule}
              onChange={(e) => setForm({ ...form, irrigationSchedule: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              placeholder="e.g. Daily 06:00"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{t("status")}</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Plot["status"] })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
            >
              <option value="active">Active</option>
              <option value="fallow">Fallow</option>
              <option value="harvested">Harvested</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("cancel")}
            </button>
            <button type="submit"
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlotsPage() {
  const { t } = useI18n();
  const { plots, addPlot, updatePlot, deletePlot } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | undefined>(undefined);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const filtered = plots.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      p.cropType.toLowerCase().includes(searchQ.toLowerCase())
  );

  const handleAdd = (data: Partial<Plot>) => {
    addPlot({
      id: `plot-${Date.now()}`,
      name: data.name!,
      cropType: data.cropType!,
      area: data.area!,
      soilType: data.soilType!,
      sowingDate: data.sowingDate!,
      status: data.status as Plot["status"],
      coordinates: [],
      color: data.color ?? "#7cb342",
      assignedSensors: [],
      irrigationSchedule: data.irrigationSchedule!,
    });
  };

  const handleEdit = (data: Partial<Plot>) => {
    if (editingPlot) updatePlot(editingPlot.id, data);
  };

  const statusColor = (s: string) =>
    s === "active" ? "bg-green-100 text-green-700" : s === "fallow" ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700";

  const totalArea = plots.reduce((s, p) => s + p.area, 0);
  const activePlots = plots.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("fieldMaps")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {plots.length} plots — {totalArea.toFixed(1)} ha total — {activePlots} active
          </p>
        </div>
        <button
          onClick={() => { setEditingPlot(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t("addPlot")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Plots", value: plots.length, color: "text-primary" },
          { label: "Active", value: activePlots, color: "text-[#7cb342]" },
          { label: "Total Area (ha)", value: totalArea.toFixed(1), color: "text-[#3498db]" },
          { label: "Crop Types", value: new Set(plots.map((p) => p.cropType)).size, color: "text-[#f39c12]" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-border px-4 py-3">
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={`${t("search")} plots...`}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Plot grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((plot) => (
          <div
            key={plot.id}
            className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setSelectedPlot(selectedPlot?.id === plot.id ? null : plot)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${plot.color}20`, border: `2px solid ${plot.color}` }}
                >
                  <Leaf className="w-5 h-5" style={{ color: plot.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{plot.name}</h3>
                  <p className="text-xs text-muted-foreground">{plot.cropType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusColor(plot.status)}`}>
                  {plot.status}
                </span>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedPlot?.id === plot.id ? "rotate-90" : ""}`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{plot.area} ha</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{plot.soilType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{plot.sowingDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-[#3498db]" />
              <span className="text-xs text-muted-foreground">{plot.irrigationSchedule}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {plot.assignedSensors.length} sensor{plot.assignedSensors.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Expanded detail */}
            {selectedPlot?.id === plot.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Boundary Points:</span>
                    <span className="ml-2 font-medium text-foreground">{plot.coordinates.length} coords</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sensors:</span>
                    <span className="ml-2 font-medium text-foreground">{plot.assignedSensors.join(", ") || "None"}</span>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Irrigation Schedule</p>
                  <p className="text-xs text-muted-foreground">{plot.irrigationSchedule}</p>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingPlot(plot); setShowForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> {t("edit")}
                  </button>
                  <button
                    onClick={() => deletePlot(plot.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t("delete")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No plots found</p>
          <p className="text-sm">{t("addPlot")} to get started</p>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <PlotFormModal
          plot={editingPlot}
          onClose={() => { setShowForm(false); setEditingPlot(undefined); }}
          onSave={editingPlot ? handleEdit : handleAdd}
        />
      )}
    </div>
  );
}
