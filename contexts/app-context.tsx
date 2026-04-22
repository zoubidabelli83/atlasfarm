"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  mockSensors,
  mockPlots,
  mockTasks,
  mockAlerts,
  mockAlertThresholds,
  mockCalibrationRecords,
  mockUsers,
  SensorData,
  Plot,
  Task,
  Alert,
  AlertThreshold,
  CalibrationRecord,
  User,
} from "@/lib/mock-data";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agronomist" | "farmer";
  language: "en" | "fr" | "ar";
  status: "active" | "inactive";
  last_login: string | null;
  created_at: string;
}

interface AppContextType {
  sensors: SensorData[];
  plots: Plot[];
  tasks: Task[];
  alerts: Alert[];
  thresholds: AlertThreshold[];
  calibrationRecords: CalibrationRecord[];
  users: User[];
  currentUser: UserProfile | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  updateThreshold: (sensorKey: string, field: "minValue" | "maxValue", value: number) => void;
  toggleThreshold: (sensorKey: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addPlot: (plot: Plot) => void;
  updatePlot: (id: string, updates: Partial<Plot>) => void;
  deletePlot: (id: string) => void;
  addCalibration: (record: CalibrationRecord) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  unreadAlertCount: number;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({
  children,
  userProfile,
}: {
  children: React.ReactNode;
  userProfile?: UserProfile | null;
}) {
  const [currentUser] = useState<UserProfile | null>(userProfile ?? null);
  const [sensors] = useState<SensorData[]>(mockSensors);
  const [plots, setPlots] = useState<Plot[]>(mockPlots);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>(mockAlertThresholds);
  const [calibrationRecords, setCalibrationRecords] = useState<CalibrationRecord[]>(mockCalibrationRecords);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  const unreadAlertCount = alerts.filter((a) => !a.acknowledged && !a.resolved).length;

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true, acknowledged: true } : a))
    );
  }, []);

  const updateThreshold = useCallback(
    (sensorKey: string, field: "minValue" | "maxValue", value: number) => {
      setThresholds((prev) =>
        prev.map((t) => (t.sensorKey === sensorKey ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const toggleThreshold = useCallback((sensorKey: string) => {
    setThresholds((prev) =>
      prev.map((t) => (t.sensorKey === sensorKey ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addPlot = useCallback((plot: Plot) => {
    setPlots((prev) => [...prev, plot]);
  }, []);

  const updatePlot = useCallback((id: string, updates: Partial<Plot>) => {
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const deletePlot = useCallback((id: string) => {
    setPlots((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addCalibration = useCallback((record: CalibrationRecord) => {
    setCalibrationRecords((prev) => [record, ...prev]);
  }, []);

  const addUser = useCallback((user: User) => {
    setUsers((prev) => [...prev, user]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        sensors,
        plots,
        tasks,
        alerts,
        thresholds,
        calibrationRecords,
        users,
        currentUser,
        sidebarOpen,
        setSidebarOpen,
        activeSection,
        setActiveSection,
        acknowledgeAlert,
        resolveAlert,
        updateThreshold,
        toggleThreshold,
        addTask,
        updateTask,
        deleteTask,
        addPlot,
        updatePlot,
        deletePlot,
        addCalibration,
        addUser,
        updateUser,
        deleteUser,
        unreadAlertCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
