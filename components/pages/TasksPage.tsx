"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  X,
  Filter,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import {
  createTask,
  deleteTask,
  listTasks,
  TaskRecord,
  updateTask,
  updateTaskStatus,
} from "@/app/actions/tasks";

const CATEGORIES = [
  "planting",
  "irrigation",
  "fertilization",
  "phAdjustment",
  "lightManagement",
  "protection",
  "harvest",
  "sensorCalibrationTask",
];

const CATEGORY_COLORS: Record<string, string> = {
  planting: "#7cb342",
  irrigation: "#3498db",
  fertilization: "#9b59b6",
  phAdjustment: "#e74c3c",
  lightManagement: "#f39c12",
  protection: "#e67e22",
  harvest: "#f1c40f",
  sensorCalibrationTask: "#1abc9c",
};

interface TaskFormProps {
  task?: TaskRecord | null;
  onSave: (t: {
    name: string;
    category: string;
    assignedTo: string;
    plotId: string | null;
    dueDate: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "inProgress" | "completed";
    description: string;
    isRecommendation?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

function TaskForm({ task, onSave, onCancel, submitting }: TaskFormProps) {
  const { t } = useI18n();
  const { plots } = useApp();
  const [form, setForm] = useState({
    name: task?.name || "",
    category: task?.category || "irrigation",
    assignedTo: task?.assignedTo || "",
    plotId: task?.plotId || plots[0]?.id || "",
    dueDate: task?.dueDate || "",
    priority: task?.priority || ("medium" as const),
    status: task?.status || ("pending" as const),
    description: task?.description || "",
    isRecommendation: task?.isRecommendation || false,
  });

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h3 className="font-semibold text-foreground">
            {task ? t("edit") : t("createTask")}
          </h3>
          <button onClick={onCancel} disabled={submitting}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("taskName")}
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("taskCategory")}
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("priority")}
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  set("priority", e.target.value as "high" | "medium" | "low")
                }
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="high">{t("high")}</option>
                <option value="medium">{t("medium")}</option>
                <option value="low">{t("low")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Field
              </label>
              <select
                value={form.plotId ?? ""}
                onChange={(e) => set("plotId", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("status")}
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  set(
                    "status",
                    e.target.value as "pending" | "inProgress" | "completed"
                  )
                }
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="pending">{t("pending")}</option>
                <option value="inProgress">{t("inProgress")}</option>
                <option value="completed">{t("completed")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("assignTo")}
              </label>
              <input
                value={form.assignedTo}
                onChange={(e) => set("assignedTo", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("dueDate")}
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {t("description")}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={() =>
              onSave({
                name: form.name,
                category: form.category,
                assignedTo: form.assignedTo,
                plotId: form.plotId || null,
                dueDate: form.dueDate,
                priority: form.priority,
                status: form.status,
                description: form.description,
                isRecommendation: form.isRecommendation,
              })
            }
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { t } = useI18n();
  const { sensors } = useApp();

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const loadTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listTasks();
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const recommendations: { msg: string; category: string }[] = useMemo(() => {
    const recs: { msg: string; category: string }[] = [];
    const moisture = sensors.find((s) => s.name === "soilMoisture");
    const ph = sensors.find((s) => s.name === "soilPH");
    const light = sensors.find((s) => s.name === "lightIntensity");
    if (moisture && moisture.value < 35)
      recs.push({ msg: t("soilTooDry"), category: "irrigation" });
    if (ph && ph.value < 6.0)
      recs.push({ msg: t("phTooLow"), category: "phAdjustment" });
    if (light && light.value < 20000)
      recs.push({ msg: t("lightTooLow"), category: "lightManagement" });
    return recs;
  }, [sensors, t]);

  const filtered = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterCat !== "all" && task.category !== filterCat) return false;
    return true;
  });

  const grouped = {
    pending: filtered.filter((t) => t.status === "pending"),
    inProgress: filtered.filter((t) => t.status === "inProgress"),
    completed: filtered.filter((t) => t.status === "completed"),
  };

  const statusIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle2 className="w-4 h-4 text-[#7cb342]" />;
    if (status === "inProgress")
      return <Clock className="w-4 h-4 text-[#3498db]" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const handleSave = async (taskData: {
    name: string;
    category: string;
    assignedTo: string;
    plotId: string | null;
    dueDate: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "inProgress" | "completed";
    description: string;
    isRecommendation?: boolean;
  }) => {
    setSubmitting(true);
    setError("");
    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, {
          name: taskData.name,
          category: taskData.category,
          assignedToName: taskData.assignedTo,
          plotId: taskData.plotId,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          status: taskData.status,
          description: taskData.description,
          isRecommendation: taskData.isRecommendation,
        });
        if (!res.success) {
          setError(res.error || "Failed to update task");
        } else if (res.task) {
          setTasks((prev) =>
            prev.map((x) => (x.id === res.task!.id ? res.task! : x))
          );
        }
      } else {
        const res = await createTask({
          name: taskData.name,
          category: taskData.category,
          assignedToName: taskData.assignedTo,
          plotId: taskData.plotId,
          dueDate: taskData.dueDate,
          priority: taskData.priority,
          status: taskData.status,
          description: taskData.description,
          isRecommendation: taskData.isRecommendation,
        });
        if (!res.success) {
          setError(res.error || "Failed to create task");
        } else if (res.task) {
          setTasks((prev) => [res.task!, ...prev]);
        }
      }
      setShowForm(false);
      setEditingTask(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await deleteTask(id);
      if (!res.success) {
        setError(res.error || "Failed to delete task");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (
    id: string,
    status: "pending" | "inProgress" | "completed"
  ) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await updateTaskStatus(id, status);
      if (!res.success) {
        setError(res.error || "Failed to update status");
        return;
      }
      if (res.task) {
        setTasks((prev) => prev.map((x) => (x.id === res.task!.id ? res.task! : x)));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRecommendation = async (rec: { msg: string; category: string }) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await createTask({
        name: rec.msg,
        category: rec.category,
        assignedToName: "",
        plotId: null,
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        priority: "high",
        status: "pending",
        description: rec.msg,
        isRecommendation: true,
      });

      if (!res.success) {
        setError(res.error || "Failed to add recommendation");
      } else if (res.task) {
        setTasks((prev) => [res.task!, ...prev]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-14 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("tasks")}</h1>
        <button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 self-start"
        >
          <Plus className="w-4 h-4" />
          {t("createTask")}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">
              {t("recommendations")}
            </h3>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 bg-white/80 rounded-lg px-3 py-2"
              >
                <p className="text-sm text-amber-700">{rec.msg}</p>
                <button
                  onClick={() => void handleAddRecommendation(rec)}
                  disabled={submitting}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 flex-shrink-0 disabled:opacity-50"
                >
                  + {t("add")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 bg-white border border-border rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {["all", "pending", "inProgress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "All" : t(s)}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1 self-center" />
        {["all", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterCat === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c === "all" ? "All Categories" : t(c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["pending", "inProgress", "completed"] as const).map((col) => (
          <div key={col} className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              {statusIcon(col)}
              <h3 className="font-semibold text-sm text-foreground">{t(col)}</h3>
              <span className="ml-auto w-5 h-5 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {grouped[col].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[col].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t("noData")}
                </p>
              )}
              {grouped[col].map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{
                        backgroundColor: CATEGORY_COLORS[task.category] || "#7cb342",
                      }}
                    />
                    <p className="text-sm font-medium text-foreground leading-snug flex-1">
                      {task.name}
                    </p>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Edit className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => void handleDelete(task.id)}
                        className="p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground">
                      {t(task.category)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-600"
                          : task.priority === "medium"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {t(task.priority)}
                    </span>
                    {task.isRecommendation && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mb-1.5">
                    {task.plotName || "-"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{task.assignedTo || "-"}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.dueDate || "-"}
                    </div>
                  </div>
                  {col !== "completed" && (
                    <div className="mt-2 pt-2 border-t border-border flex gap-1">
                      {col === "pending" && (
                        <button
                          onClick={() =>
                            void handleStatus(task.id, "inProgress")
                          }
                          className="flex-1 px-2 py-1 bg-primary/10 text-primary text-[10px] font-medium rounded-md hover:bg-primary/20"
                        >
                          Start
                        </button>
                      )}
                      {col === "inProgress" && (
                        <button
                          onClick={() => void handleStatus(task.id, "completed")}
                          className="flex-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-medium rounded-md hover:bg-green-200"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
          submitting={submitting}
        />
      )}
    </div>
  );
}
