"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Users,
  Settings,
  ScrollText,
  Activity,
  Download,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Database,
  Wifi,
  Shield,
  RefreshCw,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/contexts/i18n-context";
import { useApp } from "@/contexts/app-context";
import { mockAuditLogs } from "@/lib/mock-data";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  type ProfileRow,
} from "@/app/actions/users";

type AdminTab = "users" | "system" | "logs" | "health" | "export";

// ─── User Form Modal ─────────────────────────────────────────
function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user?: ProfileRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "farmer",
    language: user?.language ?? "fr",
    status: user?.status ?? "active",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      let result;
      if (user) {
        result = await updateUser(user.id, {
          name: form.name,
          role: form.role,
          language: form.language,
          status: form.status,
        });
      } else {
        result = await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          language: form.language,
          status: form.status,
        });
      }

      if (result.success) {
        onSaved();
        onClose();
      } else {
        setError(result.error ?? "Unknown error");
      }
    });
  };

  const handlePasswordReset = () => {
    if (!user || newPassword.length < 8) return;
    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword);
      if (result.success) {
        setShowResetPw(false);
        setNewPassword("");
      } else {
        setError(result.error ?? "Failed to reset password");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">
            {user ? t("editUser") : t("addUser")}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              {t("name")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={!!user}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {t("role")}
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as ProfileRow["role"] })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              >
                <option value="farmer">{t("farmer")}</option>
                <option value="agronomist">{t("agronomist")}</option>
                <option value="manager">{t("manager")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {t("language")}
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as ProfileRow["language"] })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              {t("status")}
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProfileRow["status"] })}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {!user && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {t("password")}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
                minLength={8}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("save")}
            </button>
          </div>
        </form>

        {/* Password reset section (edit mode only) */}
        {user && (
          <div className="mt-4 pt-4 border-t border-border">
            {!showResetPw ? (
              <button
                onClick={() => setShowResetPw(true)}
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <KeyRound className="w-3.5 h-3.5" /> Reset password
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min. 8 chars)"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetPw(false)}
                    className="flex-1 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={isPending || newPassword.length < 8}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Set password
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminPage ──────────────────────────────────────────
export default function AdminPage() {
  const { t } = useI18n();
  const { sensors, calibrationRecords, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileRow | undefined>(undefined);
  const [dbUsers, setDbUsers] = useState<ProfileRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = currentUser?.role === "admin";

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await listUsers();
      setDbUsers(data);
    } catch {
      // not admin or error
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const handleDelete = (userId: string) => {
    startTransition(async () => {
      await deleteUser(userId);
      await fetchUsers();
      setDeleteConfirm(null);
    });
  };

  const handleCSVExport = (type: string) => {
    const dataMap: Record<string, object[]> = {
      sensors: sensors.map((s) => ({ id: s.id, name: s.name, value: s.value, unit: s.unit, status: s.status })),
      calibration: calibrationRecords,
      users: dbUsers.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })),
    };
    const rows = dataMap[type] || [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => (r as Record<string, unknown>)[h]).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlasfarm-${type}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS: { key: AdminTab; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
    { key: "users", icon: Users, labelKey: "userManagement" },
    { key: "system", icon: Settings, labelKey: "systemConfig" },
    { key: "logs", icon: ScrollText, labelKey: "auditLogs" },
    { key: "health", icon: Activity, labelKey: "systemHealth" },
    { key: "export", icon: Download, labelKey: "dataExport" },
  ];

  const roleColor: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    manager: "bg-purple-100 text-purple-700",
    agronomist: "bg-blue-100 text-blue-700",
    farmer: "bg-green-100 text-green-700",
  };

  const systemChecks = [
    { label: "Database Connection (Supabase)", status: "ok", icon: Database },
    { label: "Sensor Hub (Arduino)", status: "ok", icon: Cpu },
    { label: "Network Connectivity", status: "ok", icon: Wifi },
    { label: "Auth Service", status: "ok", icon: Shield },
    { label: "Alert Service", status: "warning", icon: AlertTriangle },
    { label: "Backup Service", status: "ok", icon: RefreshCw },
  ];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-muted-foreground/40" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          Only administrators can access this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          System configuration, user management, and monitoring
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === key ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {loadingUsers ? "Loading..." : `${dbUsers.length} users registered`}
            </p>
            <button
              onClick={() => { setEditingUser(undefined); setShowUserForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> {t("addUser")}
            </button>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Loading users from database...</span>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("name")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("email")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("role")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("status")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        No users found. Add the first user above.
                      </td>
                    </tr>
                  )}
                  {dbUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-foreground">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{user.language}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${roleColor[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                          {t(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${user.status === "active" ? "text-[#7cb342]" : "text-muted-foreground"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-[#7cb342]" : "bg-gray-400"}`} />
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingUser(user); setShowUserForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM CONFIG */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Arduino Hub Port", value: "/dev/ttyUSB0", desc: "Serial communication port for sensor hub" },
            { title: "Baud Rate", value: "115200", desc: "Arduino serial baud rate" },
            { title: "Sensor Poll Interval", value: "5 seconds", desc: "How often sensor data is read" },
            { title: "Alert Check Interval", value: "30 seconds", desc: "How often alert thresholds are evaluated" },
            { title: "Data Retention", value: "365 days", desc: "Historical sensor data retention period" },
            { title: "Backup Schedule", value: "Daily 03:00", desc: "Automatic database backup time" },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                <span className="px-3 py-1 bg-muted rounded-lg text-xs font-mono font-semibold text-foreground">{item.value}</span>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-xl border border-border p-4 md:col-span-2">
            <p className="text-sm font-semibold text-foreground mb-3">Calibration Reminders</p>
            <div className="space-y-2">
              {calibrationRecords.map((rec) => {
                const daysLeft = Math.ceil((new Date(rec.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={rec.id} className={`flex items-center justify-between p-3 rounded-lg border ${daysLeft < 0 ? "bg-red-50 border-red-200" : daysLeft < 14 ? "bg-orange-50 border-orange-200" : "bg-muted border-border"}`}>
                    <span className="text-sm font-medium text-foreground">{rec.sensor}</span>
                    <span className={`text-xs font-semibold ${daysLeft < 0 ? "text-red-600" : daysLeft < 14 ? "text-orange-600" : "text-[#7cb342]"}`}>
                      {daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : `${daysLeft}d remaining`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{t("auditLogs")}</h3>
            <button
              onClick={() => handleCSVExport("users")}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium text-foreground hover:bg-border transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
          <div className="divide-y divide-border/50">
            {mockAuditLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{log.user.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm text-foreground"><span className="font-semibold">{log.user}</span> — {log.action}</p>
                      <p className="text-xs text-muted-foreground">IP: {log.ip}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemChecks.map(({ label, status, icon: Icon }) => (
              <div key={label} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${status === "ok" ? "border-green-200" : "border-orange-200"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status === "ok" ? "bg-green-50" : "bg-orange-50"}`}>
                  <Icon className={`w-5 h-5 ${status === "ok" ? "text-[#7cb342]" : "text-orange-500"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {status === "ok"
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-[#7cb342]" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    }
                    <span className={`text-xs font-medium ${status === "ok" ? "text-[#7cb342]" : "text-orange-500"}`}>
                      {status === "ok" ? "Operational" : "Degraded"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DATA EXPORT */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: "sensors", label: "Sensor Data", desc: "Export all sensor readings" },
            { key: "calibration", label: "Calibration Records", desc: "Export calibration history" },
            { key: "users", label: "User List", desc: "Export registered users" },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => handleCSVExport(key)}
              className="bg-white rounded-xl border border-border p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <Download className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                CSV
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUserForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => setShowUserForm(false)}
          onSaved={fetchUsers}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete User</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
