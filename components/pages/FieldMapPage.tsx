"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { Plot } from "@/lib/mock-data";

const CROP_COLORS: Record<string, string> = {
  Wheat: "#f39c12",
  Tomatoes: "#e74c3c",
  "Olive Trees": "#7cb342",
  Barley: "#3498db",
  Corn: "#f1c40f",
  Sunflower: "#e67e22",
};

const CROP_TYPES = ["Wheat", "Tomatoes", "Olive Trees", "Barley", "Corn", "Sunflower", "Other"];
const SOIL_TYPES = ["Loamy", "Sandy Loam", "Clay", "Silty", "Sandy", "Peaty", "Chalky"];

interface PlotFormProps {
  plot?: Plot | null;
  onSave: (plot: Partial<Plot>) => void;
  onCancel: () => void;
}

function PlotForm({ plot, onSave, onCancel }: PlotFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: plot?.name || "",
    cropType: plot?.cropType || "Wheat",
    area: plot?.area?.toString() || "",
    soilType: plot?.soilType || "Loamy",
    sowingDate: plot?.sowingDate || "",
    status: plot?.status || "active",
    irrigationSchedule: plot?.irrigationSchedule || "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{plot ? t("editPlot") : t("addPlot")}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("fieldName")}</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("cropType")}</label>
              <select value={form.cropType} onChange={(e) => set("cropType", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                {CROP_TYPES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("area")} (ha)</label>
              <input type="number" value={form.area} onChange={(e) => set("area", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("soilType")}</label>
              <select value={form.soilType} onChange={(e) => set("soilType", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                {SOIL_TYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("sowingDate")}</label>
              <input type="date" value={form.sowingDate} onChange={(e) => set("sowingDate", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("status")}</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="active">Active</option>
                <option value="fallow">Fallow</option>
                <option value="harvested">Harvested</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("irrigationSystem")}</label>
            <input value={form.irrigationSchedule} onChange={(e) => set("irrigationSchedule", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">{t("cancel")}</button>
          <button
            onClick={() => onSave({ ...form, area: parseFloat(form.area) || 0, color: CROP_COLORS[form.cropType] || "#7cb342" })}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple SVG map representation since Leaflet requires DOM
function SVGFieldMap({ plots, selectedPlot, onSelectPlot }: {
  plots: Plot[];
  selectedPlot: string | null;
  onSelectPlot: (id: string) => void;
}) {
  // Map geo coordinates to SVG canvas (simplified projection)
  const minLat = 33.565, maxLat = 33.610;
  const minLng = -7.680, maxLng = -7.610;
  const W = 600, H = 400;

  const project = ([lat, lng]: [number, number]) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: H - ((lat - minLat) / (maxLat - minLat)) * H,
  });

  return (
    <div className="relative bg-[#e8f4ea] rounded-xl overflow-hidden border border-border" style={{ height: 440 }}>
      {/* Map background grid lines */}
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="absolute inset-0">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c8dfc9" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Roads */}
        <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} stroke="#d4c9a0" strokeWidth="4" strokeDasharray="none" />
        <line x1={W * 0.45} y1="0" x2={W * 0.45} y2={H} stroke="#d4c9a0" strokeWidth="3" />

        {/* Water body */}
        <ellipse cx={W * 0.8} cy={H * 0.2} rx="40" ry="20" fill="#a8d8ea" opacity="0.7" />
        <text x={W * 0.8} y={H * 0.2 + 4} textAnchor="middle" fontSize="8" fill="#5a9ab5">Reservoir</text>

        {/* Sensor markers */}
        <circle cx={W * 0.35} cy={H * 0.42} r="8" fill="#7cb342" opacity="0.9" />
        <text x={W * 0.35} y={H * 0.42 + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">S1</text>
        <circle cx={W * 0.25} cy={H * 0.6} r="8" fill="#7cb342" opacity="0.9" />
        <text x={W * 0.25} y={H * 0.6 + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">S2</text>
        <circle cx={W * 0.7} cy={H * 0.35} r="8" fill="#7cb342" opacity="0.9" />
        <text x={W * 0.7} y={H * 0.35 + 3} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">S3</text>

        {/* Irrigation lines */}
        <path d={`M ${W * 0.3} ${H * 0.3} Q ${W * 0.35} ${H * 0.5} ${W * 0.25} ${H * 0.65}`}
          fill="none" stroke="#3498db" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

        {/* Plots */}
        {plots.map((plot) => {
          const pts = plot.coordinates.map(project);
          const polyPts = pts.map((p) => `${p.x},${p.y}`).join(" ");
          const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
          const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
          const isSelected = selectedPlot === plot.id;
          return (
            <g key={plot.id} onClick={() => onSelectPlot(plot.id)} className="cursor-pointer">
              <polygon
                points={polyPts}
                fill={plot.color}
                fillOpacity={plot.status === "fallow" ? 0.2 : isSelected ? 0.7 : 0.45}
                stroke={isSelected ? "#2d5a27" : plot.color}
                strokeWidth={isSelected ? 3 : 1.5}
                className="transition-all duration-200"
              />
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2c3e50" className="pointer-events-none select-none">
                {plot.name.split(" ").slice(-2).join(" ")}
              </text>
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize="8" fill="#555" className="pointer-events-none select-none">
                {plot.cropType}
              </text>
              <text x={cx} y={cy + 17} textAnchor="middle" fontSize="7" fill="#777" className="pointer-events-none select-none">
                {plot.area}ha
              </text>
            </g>
          );
        })}
      </svg>

      {/* Compass */}
      <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-xs font-bold text-[#2d5a27] border border-border">N</div>

      {/* Scale */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1">
        <div className="w-10 h-1 bg-[#2d5a27]" />
        <span className="text-[10px] text-[#2d5a27] font-medium">1 km</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-3 py-2 shadow border border-border">
        <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">Legend</p>
        {plots.map((plot) => (
          <div key={plot.id} className="flex items-center gap-1.5 text-[10px] text-foreground">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: plot.color }} />
            {plot.cropType}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-foreground mt-1">
          <div className="w-3 h-3 rounded-full bg-[#7cb342]" />
          Sensor
        </div>
      </div>
    </div>
  );
}

export default function FieldMapPage() {
  const { t } = useI18n();
  const { plots, addPlot, updatePlot, deletePlot } = useApp();
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [expandedInfo, setExpandedInfo] = useState(true);

  const selected = plots.find((p) => p.id === selectedPlot);

  const handleSave = (data: Partial<Plot>) => {
    if (editingPlot) {
      updatePlot(editingPlot.id, data);
    } else {
      addPlot({
        ...data,
        id: `plot-${Date.now()}`,
        coordinates: [[33.582, -7.655], [33.585, -7.655], [33.585, -7.652], [33.582, -7.652]],
        assignedSensors: [],
      } as Plot);
    }
    setShowForm(false);
    setEditingPlot(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("fieldMaps")}</h1>
        <button
          onClick={() => { setEditingPlot(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          {t("addPlot")}
        </button>
      </div>

      {/* Map */}
      <SVGFieldMap plots={plots} selectedPlot={selectedPlot} onSelectPlot={setSelectedPlot} />

      {/* Map controls hint */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-[#7cb342]" /> {t("sensorLocations")}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-muted-foreground">
          <Layers className="w-3.5 h-3.5 text-[#3498db]" /> {t("irrigationSystem")}
        </div>
      </div>

      {/* Selected plot detail */}
      {selected && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: selected.color }} />
              <h3 className="font-semibold text-foreground">{selected.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${selected.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {selected.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingPlot(selected); setShowForm(true); }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { deletePlot(selected.id); setSelectedPlot(null); }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">{t("cropType")}</p><p className="font-medium text-foreground">{selected.cropType}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("area")}</p><p className="font-medium text-foreground">{selected.area} ha</p></div>
            <div><p className="text-xs text-muted-foreground">{t("soilType")}</p><p className="font-medium text-foreground">{selected.soilType}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("sowingDate")}</p><p className="font-medium text-foreground">{selected.sowingDate}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("irrigationSystem")}</p><p className="font-medium text-foreground">{selected.irrigationSchedule}</p></div>
            <div><p className="text-xs text-muted-foreground">GPS Coordinates</p><p className="font-medium text-foreground text-xs">{selected.coordinates[0][0].toFixed(4)}°N, {selected.coordinates[0][1].toFixed(4)}°E</p></div>
            <div><p className="text-xs text-muted-foreground">Sensors Assigned</p><p className="font-medium text-foreground">{selected.assignedSensors.length} sensors</p></div>
          </div>
        </div>
      )}

      {/* Plots list */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">{t("plotDetails")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("fieldName")}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("cropType")}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("area")}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("status")}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sowingDate")}</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plots.map((plot) => (
                <tr
                  key={plot.id}
                  className={`border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${selectedPlot === plot.id ? "bg-primary/5" : ""}`}
                  onClick={() => setSelectedPlot(plot.id === selectedPlot ? null : plot.id)}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: plot.color }} />
                      <span className="font-medium text-foreground">{plot.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-foreground">{plot.cropType}</td>
                  <td className="py-2.5 px-3 text-foreground">{plot.area} ha</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${plot.status === "active" ? "bg-green-100 text-green-700" : plot.status === "fallow" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>
                      {plot.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{plot.sowingDate}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlot(plot); setShowForm(true); }} className="p-1.5 hover:bg-muted rounded-lg">
                        <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePlot(plot.id); }} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PlotForm
          plot={editingPlot}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingPlot(null); }}
        />
      )}
    </div>
  );
}
