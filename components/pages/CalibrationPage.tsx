"use client";
import React, { useState } from "react";
import {
  FlaskConical,
  Droplets,
  Sun,
  Gauge,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Save,
  History,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { CalibrationRecord } from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type CalibrationModule = "ph" | "moisture" | "light" | "water" | null;

// ── pH Calibration (3-point wizard) ─────────────────────────────────────────
const PH_BUFFERS = [
  { step: 1, value: 4.01, labelKey: "buffer401", color: "#e74c3c", emoji: "🔴" },
  { step: 2, value: 6.86, labelKey: "buffer686", color: "#7cb342", emoji: "🟢" },
  { step: 3, value: 9.18, labelKey: "buffer918", color: "#3498db", emoji: "🔵" },
];

function PHCalibrationWizard({ onSave }: { onSave: (record: CalibrationRecord) => void }) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [readings, setReadings] = useState<number[]>([]);
  const [simValue, setSimValue] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [saved, setSaved] = useState(false);

  const buffer = PH_BUFFERS[currentStep];

  const simulateReading = () => {
    const noise = (Math.random() - 0.5) * 0.08;
    return +(buffer.value + noise).toFixed(3);
  };

  React.useEffect(() => {
    if (currentStep < 3 && !captured) {
      const drift = +(buffer.value + (Math.random() - 0.5) * 0.15).toFixed(3);
      setSimValue(drift);
      const iv = setInterval(() => {
        setSimValue(+(buffer.value + (Math.random() - 0.5) * 0.12).toFixed(3));
      }, 1200);
      return () => clearInterval(iv);
    }
  }, [currentStep, captured, buffer]);

  const captureReading = () => {
    const val = simulateReading();
    setReadings((prev) => [...prev, val]);
    setCaptured(true);
  };

  const nextStep = () => {
    setCaptured(false);
    setCurrentStep((prev) => prev + 1);
  };

  const handleSave = () => {
    const record: CalibrationRecord = {
      id: `cal-ph-${Date.now()}`,
      sensor: "soilPH",
      sensorKey: "soilPH",
      date: new Date().toISOString().split("T")[0],
      performedBy: "Ahmed Benali",
      values: {
        point1: readings[0] ?? 0,
        point2: readings[1] ?? 0,
        point3: readings[2] ?? 0,
      },
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "3-point pH calibration completed via wizard.",
    };
    onSave(record);
    setSaved(true);
  };

  // Calibration curve data for chart
  const curveData =
    readings.length === 3
      ? [
          { buffer: 4.01, measured: readings[0] },
          { buffer: 6.86, measured: readings[1] },
          { buffer: 9.18, measured: readings[2] },
          { buffer: 7, measured: +(readings[1] + (readings[2] - readings[1]) * ((7 - 6.86) / (9.18 - 6.86))).toFixed(3) },
        ].sort((a, b) => a.buffer - b.buffer)
      : [];

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#7cb342]" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("calibrationSaved")}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          pH calibration data stored. Next calibration due in 90 days.
        </p>
        <button
          onClick={() => { setCurrentStep(0); setReadings([]); setSaved(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {PH_BUFFERS.map((b, idx) => (
          <React.Fragment key={b.step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`cal-step-circle ${idx < currentStep ? "done" : idx === currentStep ? "active" : "pending"}`}>
                {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : b.step}
              </div>
              <span className="text-[10px] text-muted-foreground text-center hidden sm:block">
                pH {b.value}
              </span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-0.5 rounded-full ${idx < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {currentStep < 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: instructions */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    {t("step")} {currentStep + 1}: {t(buffer.labelKey)}
                  </p>
                  <ol className="text-xs text-blue-700 space-y-1 list-decimal ml-4">
                    <li>Rinse pH electrode with distilled water</li>
                    <li>Dry gently with lint-free cloth</li>
                    <li>Immerse in buffer solution pH {buffer.value}</li>
                    <li>Wait for stable reading (~30 seconds)</li>
                    <li>Click &quot;{t("captureReading")}&quot; when stable</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t("currentReading")}</p>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-5xl font-bold ${captured ? "text-[#7cb342]" : "text-foreground"}`}>
                  {captured ? readings[currentStep] : simValue.toFixed(3)}
                </span>
                <span className="text-lg text-muted-foreground mb-1">pH</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${captured ? "bg-[#7cb342]" : "bg-yellow-400 live-indicator"}`} />
                {captured ? "Reading captured" : "Stabilizing..."}
              </div>
            </div>

            {!captured ? (
              <button
                onClick={captureReading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                {t("captureReading")}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="w-full py-3 bg-[#7cb342] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {currentStep < 2 ? (
                  <>{t("next")} <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Review Calibration <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>

          {/* Right: buffer guide */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Buffer Solutions Guide</p>
            {PH_BUFFERS.map((b, idx) => (
              <div
                key={b.step}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  idx === currentStep
                    ? "border-primary bg-primary/5"
                    : idx < currentStep
                    ? "border-green-200 bg-green-50"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${b.color}20`, border: `2px solid ${b.color}` }}>
                  <span className="text-xs font-bold" style={{ color: b.color }}>{b.value}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t(b.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">Expected: pH {b.value}</p>
                </div>
                {idx < currentStep && (
                  <div className="text-right">
                    <p className="text-xs font-semibold text-[#7cb342]">{readings[idx]}</p>
                    <CheckCircle2 className="w-4 h-4 text-[#7cb342] ml-auto" />
                  </div>
                )}
              </div>
            ))}

            {readings.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-semibold text-foreground mb-1">Captured so far:</p>
                {readings.map((r, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>Point {i + 1} (pH {PH_BUFFERS[i].value})</span>
                    <span className="font-semibold text-foreground">{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Review step */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Calibration Summary</h4>
            {PH_BUFFERS.map((b, idx) => (
              <div key={b.step} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-foreground">Buffer pH {b.value}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{readings[idx]}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (error: {Math.abs(readings[idx] - b.value).toFixed(3)})
                  </span>
                </div>
              </div>
            ))}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#7cb342]" />
              <p className="text-sm text-green-800 font-medium">All 3 points calibrated successfully</p>
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t("saveCalibration")}
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Calibration Curve</p>
            <div className="bg-white border border-border rounded-xl p-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={curveData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="buffer" tick={{ fontSize: 10 }} label={{ value: "Buffer pH", position: "insideBottom", offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[3, 10]} label={{ value: "Measured", angle: -90, position: "insideLeft", fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <ReferenceLine y={7} stroke="#7cb342" strokeDasharray="4 4" strokeWidth={1} />
                  <Line type="monotone" dataKey="measured" stroke="#9b59b6" strokeWidth={2.5} dot={{ r: 5, fill: "#9b59b6" }} name="Measured" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Soil Moisture Calibration (2-point) ─────────────────────────────────────
function MoistureCalibrationWizard({ onSave }: { onSave: (record: CalibrationRecord) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"dry" | "wet" | "done">("dry");
  const [dryRaw, setDryRaw] = useState<number | null>(null);
  const [wetRaw, setWetRaw] = useState<number | null>(null);
  const [simVal, setSimVal] = useState(1020);

  React.useEffect(() => {
    const base = step === "dry" ? 1020 : 200;
    setSimVal(+(base + (Math.random() - 0.5) * 30).toFixed(0));
    const iv = setInterval(() => {
      setSimVal(+(base + (Math.random() - 0.5) * 25).toFixed(0));
    }, 1000);
    return () => clearInterval(iv);
  }, [step]);

  const captureDry = () => {
    setDryRaw(simVal);
    setStep("wet");
  };

  const captureWet = () => {
    setWetRaw(simVal);
  };

  const handleSave = () => {
    if (dryRaw === null || wetRaw === null) return;
    const record: CalibrationRecord = {
      id: `cal-moist-${Date.now()}`,
      sensor: "soilMoisture",
      sensorKey: "soilMoisture",
      date: new Date().toISOString().split("T")[0],
      performedBy: "Ahmed Benali",
      values: { dry: dryRaw, wet: wetRaw },
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: `2-point calibration. Dry: ${dryRaw} raw, Wet: ${wetRaw} raw.`,
    };
    onSave(record);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#7cb342]" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("calibrationSaved")}</h3>
        <p className="text-sm text-muted-foreground">Dry: {dryRaw} raw | Wet: {wetRaw} raw</p>
        <button onClick={() => { setStep("dry"); setDryRaw(null); setWetRaw(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="flex items-center gap-3">
        {["dry", "wet"].map((s, idx) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div className={`cal-step-circle ${(s === "dry" && dryRaw !== null) || (s === "wet" && wetRaw !== null) ? "done" : s === step ? "active" : "pending"}`}>
                {(s === "dry" && dryRaw !== null) || (s === "wet" && wetRaw !== null) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {s === "dry" ? t("dryCalibration") : t("wetCalibration")}
              </span>
            </div>
            {idx < 1 && <div className={`flex-1 h-0.5 rounded-full ${dryRaw !== null ? "bg-primary" : "bg-muted"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            {step === "dry" ? (
              <><strong>Step 1 — {t("dryCalibration")}</strong><br />
              Hold the soil moisture sensor in open air. Ensure it is completely dry. Wait for stable reading, then capture.</>
            ) : (
              <><strong>Step 2 — {t("wetCalibration")}</strong><br />
              Submerge the sensor fully in clean water. Wait for stable reading (~30s), then capture.</>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t("currentReading")} (Raw ADC)</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-foreground">{simVal}</span>
              <span className="text-lg text-muted-foreground mb-1">raw</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-yellow-400 live-indicator" />
              Stabilizing...
            </div>
          </div>

          {step === "dry" ? (
            <button onClick={captureDry}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
              {t("captureReading")} (Dry)
            </button>
          ) : (
            <div className="space-y-2">
              {!wetRaw ? (
                <button onClick={captureWet}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
                  {t("captureReading")} (Wet)
                </button>
              ) : (
                <button onClick={handleSave}
                  className="w-full py-3 bg-[#7cb342] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {t("saveCalibration")}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Calibration Points</p>
          <div className={`p-4 rounded-xl border ${dryRaw !== null ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Dry Value (Air)</span>
              {dryRaw !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{dryRaw}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#7cb342]" />
                </div>
              ) : <span className="text-xs text-muted-foreground">Not captured</span>}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${wetRaw !== null ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Wet Value (Water)</span>
              {wetRaw !== null ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{wetRaw}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#7cb342]" />
                </div>
              ) : <span className="text-xs text-muted-foreground">Not captured</span>}
            </div>
          </div>
          {dryRaw !== null && wetRaw !== null && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-foreground">
              <p className="font-semibold mb-1">Formula:</p>
              <p className="font-mono text-muted-foreground">
                moisture% = (({dryRaw} - raw) / ({dryRaw} - {wetRaw})) × 100
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Light Sensor Verification ────────────────────────────────────────────────
function LightCalibrationWizard({ onSave }: { onSave: (record: CalibrationRecord) => void }) {
  const { t } = useI18n();
  const [refValue, setRefValue] = useState<string>("45000");
  const [measuredValue] = useState<number>(43500);
  const [offsetApplied, setOffsetApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const offset = Number(refValue) - measuredValue;

  const handleSave = () => {
    const record: CalibrationRecord = {
      id: `cal-light-${Date.now()}`,
      sensor: "lightIntensity",
      sensorKey: "lightIntensity",
      date: new Date().toISOString().split("T")[0],
      performedBy: "Ahmed Benali",
      values: { referenceValue: Number(refValue), measuredValue, offset },
      nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: `Light sensor verified with reference lux meter. Offset: ${offset} lux applied.`,
    };
    onSave(record);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#7cb342]" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("calibrationSaved")}</h3>
        <p className="text-sm text-muted-foreground">Offset of {offset} lux applied. Next check in 6 months.</p>
        <button onClick={() => { setOffsetApplied(false); setSaved(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <p className="font-semibold mb-1">Factory Calibrated — Verification Only</p>
          <p>The light sensor is factory calibrated. This wizard compares the sensor reading against a reference lux meter and applies a correction offset if needed.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sensor Current Reading</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{measuredValue.toLocaleString()}</span>
              <span className="text-lg text-muted-foreground mb-1">lux</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-[#7cb342] live-indicator" />
              Live reading
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
              {t("referenceValue")} (Lux Meter)
            </label>
            <input
              type="number"
              value={refValue}
              onChange={(e) => setRefValue(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground pb-1"
              placeholder="45000"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter reading from your reference lux meter</p>
          </div>

          <div className={`p-4 rounded-xl border ${Math.abs(offset) > 2000 ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{t("offset")}</span>
              <span className={`text-lg font-bold ${Math.abs(offset) > 2000 ? "text-orange-600" : "text-[#7cb342]"}`}>
                {offset > 0 ? "+" : ""}{offset.toLocaleString()} lux
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(offset) > 2000 ? "Significant drift detected — offset correction recommended" : "Within acceptable tolerance"}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setOffsetApplied(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${offsetApplied ? "bg-[#7cb342] text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
              {t("applyOffset")}
            </button>
            <button onClick={handleSave}
              disabled={!offsetApplied}
              className="flex-1 py-2.5 bg-[#7cb342] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {t("saveCalibration")}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Comparison</p>
          <div className="space-y-2">
            {[
              { label: "Sensor Reading", value: measuredValue, color: "#3498db" },
              { label: "Reference (Lux Meter)", value: Number(refValue) || 0, color: "#f39c12" },
              { label: "After Offset", value: measuredValue + offset, color: "#7cb342" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value.toLocaleString()} lux</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min((item.value / 100000) * 100, 100)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-muted rounded-xl text-xs text-muted-foreground mt-4">
            <p className="font-semibold text-foreground mb-1">Factory Calibration Info</p>
            <p>Sensor model: BH1750FVI</p>
            <p>Resolution: 1 lux</p>
            <p>Range: 1 - 65535 lux</p>
            <p>Accuracy: ±20%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Water Level Calibration (2-point) ────────────────────────────────────────
function WaterLevelCalibrationWizard({ onSave }: { onSave: (record: CalibrationRecord) => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<"empty" | "full" | "done">("empty");
  const [emptyVal, setEmptyVal] = useState<number | null>(null);
  const [fullVal, setFullVal] = useState<number | null>(null);
  const [simVal, setSimVal] = useState(15);

  React.useEffect(() => {
    const base = step === "empty" ? 15 : 450;
    setSimVal(+(base + (Math.random() - 0.5) * 5).toFixed(1));
    const iv = setInterval(() => {
      setSimVal(+(base + (Math.random() - 0.5) * 4).toFixed(1));
    }, 1100);
    return () => clearInterval(iv);
  }, [step]);

  const captureEmpty = () => { setEmptyVal(simVal); setStep("full"); };
  const captureFull = () => setFullVal(simVal);
  const handleSave = () => {
    if (emptyVal === null || fullVal === null) return;
    const record: CalibrationRecord = {
      id: `cal-water-${Date.now()}`,
      sensor: "waterLevel",
      sensorKey: "waterLevel",
      date: new Date().toISOString().split("T")[0],
      performedBy: "Ahmed Benali",
      values: { empty: emptyVal, full: fullVal },
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: `Ultrasonic sensor calibrated. Empty: ${emptyVal}cm, Full: ${fullVal}cm.`,
    };
    onSave(record);
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#7cb342]" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("calibrationSaved")}</h3>
        <p className="text-sm text-muted-foreground">Empty: {emptyVal}cm | Full: {fullVal}cm</p>
        <button onClick={() => { setStep("empty"); setEmptyVal(null); setFullVal(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> Recalibrate
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {["empty", "full"].map((s, idx) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div className={`cal-step-circle ${(s === "empty" && emptyVal !== null) || (s === "full" && fullVal !== null) ? "done" : s === step ? "active" : "pending"}`}>
                {(s === "empty" && emptyVal !== null) || (s === "full" && fullVal !== null) ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {s === "empty" ? t("emptyCalibration") : t("fullCalibration")}
              </span>
            </div>
            {idx < 1 && <div className={`flex-1 h-0.5 rounded-full ${emptyVal !== null ? "bg-primary" : "bg-muted"}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-cyan-800">
            {step === "empty" ? (
              <><strong>Step 1 — {t("emptyCalibration")}</strong><br />
              Ensure the water tank is completely empty. The ultrasonic sensor will measure the maximum distance (to the bottom of the tank). Capture when stable.</>
            ) : (
              <><strong>Step 2 — {t("fullCalibration")}</strong><br />
              Fill the water tank to maximum capacity. The ultrasonic sensor measures minimum distance (water surface near sensor). Capture when stable.</>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{t("currentReading")} (Distance)</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-foreground">{simVal.toFixed(1)}</span>
              <span className="text-lg text-muted-foreground mb-1">cm</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-yellow-400 live-indicator" />
              Ultrasonic reading...
            </div>
          </div>

          {step === "empty" ? (
            <button onClick={captureEmpty}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
              {t("captureReading")} (Empty)
            </button>
          ) : (
            !fullVal ? (
              <button onClick={captureFull}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
                {t("captureReading")} (Full)
              </button>
            ) : (
              <button onClick={handleSave}
                className="w-full py-3 bg-[#7cb342] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {t("saveCalibration")}
              </button>
            )
          )}
        </div>

        <div className="space-y-3">
          {/* Tank visual */}
          <p className="text-sm font-semibold text-foreground">Tank Visualization</p>
          <div className="bg-white border border-border rounded-xl p-4 flex justify-center">
            <div className="relative w-24 h-40 border-2 border-[#3498db] rounded-b-lg overflow-hidden bg-gray-50">
              <div
                className="absolute bottom-0 w-full bg-[#3498db]/30 transition-all duration-500"
                style={{ height: step === "full" ? "90%" : "5%" }}
              />
              <div className="absolute top-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] text-[#3498db] font-bold">Sensor</span>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-[9px] text-muted-foreground font-semibold">{step === "empty" ? "EMPTY" : "FULL"}</span>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${emptyVal !== null ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Empty distance</span>
              {emptyVal !== null
                ? <span className="text-sm font-bold text-[#7cb342]">{emptyVal} cm <CheckCircle2 className="inline w-4 h-4" /></span>
                : <span className="text-xs text-muted-foreground">Pending</span>}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${fullVal !== null ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Full distance</span>
              {fullVal !== null
                ? <span className="text-sm font-bold text-[#7cb342]">{fullVal} cm <CheckCircle2 className="inline w-4 h-4" /></span>
                : <span className="text-xs text-muted-foreground">Pending</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Calibration History Panel ────────────────────────────────────────────────
function CalibrationHistory() {
  const { t } = useI18n();
  const { calibrationRecords } = useApp();

  const daysDiff = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const SENSOR_LABELS: Record<string, string> = {
    soilPH: "pH Sensor",
    soilMoisture: "Soil Moisture",
    lightIntensity: "Light Sensor",
    waterLevel: "Water Level",
  };

  return (
    <div className="space-y-3">
      {calibrationRecords.map((record) => {
        const daysLeft = daysDiff(record.nextDueDate);
        const isOverdue = daysLeft < 0;
        const isSoon = daysLeft < 14;
        return (
          <div key={record.id} className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    {SENSOR_LABELS[record.sensorKey] || record.sensor}
                  </span>
                  {isOverdue && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">OVERDUE</span>
                  )}
                  {!isOverdue && isSoon && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold">DUE SOON</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{record.notes}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{t("lastCalibrated")}: {record.date}</span>
                </div>
                <div className={`text-xs font-semibold ${isOverdue ? "text-red-600" : isSoon ? "text-orange-600" : "text-[#7cb342]"}`}>
                  {isOverdue
                    ? `Overdue by ${Math.abs(daysLeft)} days`
                    : `Due in ${daysLeft} days (${record.nextDueDate})`}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>By {record.performedBy}</span>
              <span>|</span>
              {Object.entries(record.values).map(([k, v]) => (
                <span key={k}>{k}: <strong className="text-foreground">{v}</strong></span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main CalibrationPage ──────────────────────────────────────────────────────
const CALIBRATION_MODULES = [
  {
    key: "ph" as CalibrationModule,
    icon: FlaskConical,
    labelKey: "phCalibration",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    desc: "3-point calibration (pH 4.01, 6.86, 9.18)",
    type: "3-point",
  },
  {
    key: "moisture" as CalibrationModule,
    icon: Droplets,
    labelKey: "moistureCalibration",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    desc: "2-point calibration (Dry air / Wet water)",
    type: "2-point",
  },
  {
    key: "light" as CalibrationModule,
    icon: Sun,
    labelKey: "lightCalibration",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    desc: "Factory calibrated — verify with reference lux meter",
    type: "Verification",
  },
  {
    key: "water" as CalibrationModule,
    icon: Gauge,
    labelKey: "waterLevelCalibration",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    desc: "2-point calibration (Empty / Full tank)",
    type: "2-point",
  },
];

export default function CalibrationPage() {
  const { t } = useI18n();
  const { addCalibration, calibrationRecords } = useApp();
  const [activeModule, setActiveModule] = useState<CalibrationModule>(null);
  const [activeTab, setActiveTab] = useState<"wizard" | "history">("wizard");

  const handleSave = (record: CalibrationRecord) => {
    addCalibration(record);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("sensorCalibration")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("calibrationWizard")} — pH, Moisture, Light & Water Level
          </p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "wizard" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="w-4 h-4" />
            {t("calibrationWizard")}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "history" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <History className="w-4 h-4" />
            {t("calibrationHistory")} ({calibrationRecords.length})
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <CalibrationHistory />
      ) : (
        <>
          {/* Module selector cards */}
          {!activeModule && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CALIBRATION_MODULES.map((mod) => {
                const Icon = mod.icon;
                const lastCal = calibrationRecords.find((r) => r.sensorKey === (
                  mod.key === "ph" ? "soilPH" :
                  mod.key === "moisture" ? "soilMoisture" :
                  mod.key === "light" ? "lightIntensity" :
                  "waterLevel"
                ));
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    className={`text-left bg-white rounded-xl p-5 border-2 ${mod.border} hover:shadow-md transition-all group`}
                  >
                    <div className={`w-12 h-12 ${mod.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-6 h-6 ${mod.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{t(mod.labelKey)}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{mod.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${mod.bg} ${mod.color}`}>
                        {mod.type}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${mod.color}`} />
                    </div>
                    {lastCal && (
                      <p className="text-[10px] text-muted-foreground mt-2">{t("lastCalibrated")}: {lastCal.date}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active wizard */}
          {activeModule && (
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setActiveModule(null)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="h-4 w-px bg-border" />
                {(() => {
                  const mod = CALIBRATION_MODULES.find((m) => m.key === activeModule)!;
                  const Icon = mod.icon;
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${mod.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${mod.color}`} />
                      </div>
                      <h2 className="font-bold text-foreground">{t(mod.labelKey)}</h2>
                    </div>
                  );
                })()}
              </div>

              {activeModule === "ph" && <PHCalibrationWizard onSave={handleSave} />}
              {activeModule === "moisture" && <MoistureCalibrationWizard onSave={handleSave} />}
              {activeModule === "light" && <LightCalibrationWizard onSave={handleSave} />}
              {activeModule === "water" && <WaterLevelCalibrationWizard onSave={handleSave} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
