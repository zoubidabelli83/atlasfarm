export interface SensorReading {
  timestamp: string;
  value: number;
}

export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: "optimal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  min: number;
  max: number;
  history: SensorReading[];
}

export interface Plot {
  id: string;
  name: string;
  cropType: string;
  area: number;
  soilType: string;
  sowingDate: string;
  status: "active" | "fallow" | "harvested";
  coordinates: [number, number][];
  color: string;
  assignedSensors: string[];
  irrigationSchedule: string;
}

export interface Task {
  id: string;
  name: string;
  category: string;
  assignedTo: string;
  plotId: string;
  plotName: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "inProgress" | "completed";
  description: string;
  isRecommendation?: boolean;
}

export interface Alert {
  id: string;
  sensor: string;
  sensorKey: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  value: number;
  threshold: number;
}

export interface AlertThreshold {
  sensorKey: string;
  minValue: number;
  maxValue: number;
  enabled: boolean;
}

export interface CalibrationRecord {
  id: string;
  sensor: string;
  sensorKey: string;
  date: string;
  performedBy: string;
  values: Record<string, number>;
  nextDueDate: string;
  notes: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "agronomist" | "manager" | "admin";
  status: "active" | "inactive";
  lastLogin: string;
  language: "en" | "fr" | "ar";
}

export interface WeatherDay {
  day: string;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  condition: string;
  icon: string;
  precipitation: number;
}

// Generate time-series history
const generateHistory = (
  base: number,
  variance: number,
  points: number
): SensorReading[] => {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (points - i));
    return {
      timestamp: d.toISOString(),
      value: +(base + (Math.random() - 0.5) * variance * 2).toFixed(2),
    };
  });
};

export const mockSensors: SensorData[] = [
  {
    id: "temp-001",
    name: "airTemperature",
    value: 24.3,
    unit: "°C",
    status: "optimal",
    trend: "stable",
    min: 15,
    max: 40,
    history: generateHistory(24, 4, 24),
  },
  {
    id: "hum-001",
    name: "airHumidity",
    value: 68,
    unit: "%",
    status: "optimal",
    trend: "up",
    min: 40,
    max: 90,
    history: generateHistory(68, 8, 24),
  },
  {
    id: "soil-001",
    name: "soilMoisture",
    value: 32,
    unit: "%",
    status: "warning",
    trend: "down",
    min: 30,
    max: 80,
    history: generateHistory(45, 10, 24),
  },
  {
    id: "ph-001",
    name: "soilPH",
    value: 6.4,
    unit: "pH",
    status: "optimal",
    trend: "stable",
    min: 5.5,
    max: 8.0,
    history: generateHistory(6.5, 0.5, 24),
  },
  {
    id: "light-001",
    name: "lightIntensity",
    value: 42500,
    unit: "lux",
    status: "optimal",
    trend: "down",
    min: 0,
    max: 100000,
    history: generateHistory(40000, 15000, 24),
  },
  {
    id: "water-001",
    name: "waterLevel",
    value: 71,
    unit: "%",
    status: "optimal",
    trend: "down",
    min: 20,
    max: 100,
    history: generateHistory(75, 10, 24),
  },
];

export const mockPlots: Plot[] = [
  {
    id: "plot-001",
    name: "North Field A",
    cropType: "Wheat",
    area: 12.5,
    soilType: "Loamy",
    sowingDate: "2024-10-15",
    status: "active",
    coordinates: [
      [33.58, -7.65],
      [33.59, -7.65],
      [33.59, -7.64],
      [33.58, -7.64],
    ],
    color: "#7cb342",
    assignedSensors: ["soil-001", "ph-001"],
    irrigationSchedule: "Daily 06:00",
  },
  {
    id: "plot-002",
    name: "South Field B",
    cropType: "Tomatoes",
    area: 8.2,
    soilType: "Sandy Loam",
    sowingDate: "2024-11-01",
    status: "active",
    coordinates: [
      [33.575, -7.66],
      [33.585, -7.66],
      [33.585, -7.655],
      [33.575, -7.655],
    ],
    color: "#e74c3c",
    assignedSensors: ["soil-001"],
    irrigationSchedule: "Every 2 days 07:00",
  },
  {
    id: "plot-003",
    name: "East Field C",
    cropType: "Olive Trees",
    area: 20.0,
    soilType: "Clay",
    sowingDate: "2023-03-20",
    status: "active",
    coordinates: [
      [33.59, -7.63],
      [33.60, -7.63],
      [33.60, -7.62],
      [33.59, -7.62],
    ],
    color: "#f39c12",
    assignedSensors: ["ph-001", "water-001"],
    irrigationSchedule: "Weekly Monday 05:00",
  },
  {
    id: "plot-004",
    name: "West Field D",
    cropType: "Barley",
    area: 15.0,
    soilType: "Silty",
    sowingDate: "2024-10-20",
    status: "fallow",
    coordinates: [
      [33.57, -7.67],
      [33.58, -7.67],
      [33.58, -7.66],
      [33.57, -7.66],
    ],
    color: "#3498db",
    assignedSensors: [],
    irrigationSchedule: "None",
  },
];

export const mockTasks: Task[] = [
  {
    id: "task-001",
    name: "Soil pH adjustment - North Field A",
    category: "phAdjustment",
    assignedTo: "Ahmed Benali",
    plotId: "plot-001",
    plotName: "North Field A",
    dueDate: "2025-01-20",
    priority: "high",
    status: "pending",
    description: "Apply lime to raise pH from 6.2 to 6.8",
    isRecommendation: true,
  },
  {
    id: "task-002",
    name: "Irrigation - South Field B",
    category: "irrigation",
    assignedTo: "Fatima Zahra",
    plotId: "plot-002",
    plotName: "South Field B",
    dueDate: "2025-01-18",
    priority: "high",
    status: "inProgress",
    description: "Soil moisture at 32% - below optimal threshold",
    isRecommendation: true,
  },
  {
    id: "task-003",
    name: "pH Sensor Calibration",
    category: "sensorCalibrationTask",
    assignedTo: "Omar Idrissi",
    plotId: "plot-001",
    plotName: "North Field A",
    dueDate: "2025-01-22",
    priority: "medium",
    status: "pending",
    description: "3-point pH calibration with buffer solutions 4.01, 6.86, 9.18",
  },
  {
    id: "task-004",
    name: "Olive tree fertilization",
    category: "fertilization",
    assignedTo: "Ahmed Benali",
    plotId: "plot-003",
    plotName: "East Field C",
    dueDate: "2025-01-25",
    priority: "medium",
    status: "pending",
    description: "Apply NPK fertilizer according to soil analysis",
  },
  {
    id: "task-005",
    name: "Light sensor check - South Field",
    category: "lightManagement",
    assignedTo: "Fatima Zahra",
    plotId: "plot-002",
    plotName: "South Field B",
    dueDate: "2025-01-19",
    priority: "low",
    status: "completed",
    description: "Verify light sensor readings with reference lux meter",
    isRecommendation: true,
  },
  {
    id: "task-006",
    name: "Wheat harvest preparation",
    category: "harvest",
    assignedTo: "Omar Idrissi",
    plotId: "plot-001",
    plotName: "North Field A",
    dueDate: "2025-02-15",
    priority: "medium",
    status: "pending",
    description: "Prepare equipment and schedule harvest crew",
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    sensor: "soilMoisture",
    sensorKey: "soilMoisture",
    message: "Soil moisture critically low: 32% (threshold: 35%)",
    severity: "critical",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
    resolved: false,
    value: 32,
    threshold: 35,
  },
  {
    id: "alert-002",
    sensor: "soilPH",
    sensorKey: "soilPH",
    message: "pH slightly acidic: 6.4 (optimal range: 6.5-7.0)",
    severity: "warning",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    resolved: false,
    value: 6.4,
    threshold: 6.5,
  },
  {
    id: "alert-003",
    sensor: "waterLevel",
    sensorKey: "waterLevel",
    message: "Water tank at 71% - monitor closely",
    severity: "info",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
    resolved: false,
    value: 71,
    threshold: 70,
  },
  {
    id: "alert-004",
    sensor: "airTemperature",
    sensorKey: "airTemperature",
    message: "Temperature spike: 38.2°C (max threshold: 35°C)",
    severity: "critical",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    acknowledged: true,
    resolved: true,
    value: 38.2,
    threshold: 35,
  },
  {
    id: "alert-005",
    sensor: "lightIntensity",
    sensorKey: "lightIntensity",
    message: "Light intensity below minimum for tomato growth",
    severity: "warning",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    acknowledged: false,
    resolved: false,
    value: 15000,
    threshold: 20000,
  },
];

export const mockAlertThresholds: AlertThreshold[] = [
  { sensorKey: "airTemperature", minValue: 5, maxValue: 38, enabled: true },
  { sensorKey: "airHumidity", minValue: 30, maxValue: 95, enabled: true },
  { sensorKey: "soilMoisture", minValue: 35, maxValue: 80, enabled: true },
  { sensorKey: "soilPH", minValue: 5.5, maxValue: 8.0, enabled: true },
  { sensorKey: "lightIntensity", minValue: 10000, maxValue: 90000, enabled: true },
  { sensorKey: "waterLevel", minValue: 20, maxValue: 100, enabled: true },
];

export const mockCalibrationRecords: CalibrationRecord[] = [
  {
    id: "cal-001",
    sensor: "soilPH",
    sensorKey: "soilPH",
    date: "2024-12-15",
    performedBy: "Ahmed Benali",
    values: { point1: 4.01, point2: 6.86, point3: 9.18 },
    nextDueDate: "2025-03-15",
    notes: "3-point calibration completed. Drift within acceptable range.",
  },
  {
    id: "cal-002",
    sensor: "soilMoisture",
    sensorKey: "soilMoisture",
    date: "2024-12-20",
    performedBy: "Omar Idrissi",
    values: { dry: 1020, wet: 200 },
    nextDueDate: "2025-03-20",
    notes: "2-point calibration. Dry: 1020 raw, Wet: 200 raw.",
  },
  {
    id: "cal-003",
    sensor: "waterLevel",
    sensorKey: "waterLevel",
    date: "2024-11-30",
    performedBy: "Fatima Zahra",
    values: { empty: 15, full: 450 },
    nextDueDate: "2025-02-28",
    notes: "Ultrasonic sensor calibrated. Empty: 15cm, Full: 450cm.",
  },
  {
    id: "cal-004",
    sensor: "lightIntensity",
    sensorKey: "lightIntensity",
    date: "2024-12-10",
    performedBy: "Ahmed Benali",
    values: { referenceValue: 45000, measuredValue: 43500, offset: 1500 },
    nextDueDate: "2025-06-10",
    notes: "Compared with Konica Minolta T-10A lux meter. Offset applied.",
  },
];

export const mockUsers: User[] = [
  {
    id: "user-001",
    name: "Ahmed Benali",
    email: "ahmed@atlasfarm.ma",
    role: "admin",
    status: "active",
    lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    language: "ar",
  },
  {
    id: "user-002",
    name: "Fatima Zahra",
    email: "fatima@atlasfarm.ma",
    role: "agronomist",
    status: "active",
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    language: "fr",
  },
  {
    id: "user-003",
    name: "Omar Idrissi",
    email: "omar@atlasfarm.ma",
    role: "farmer",
    status: "active",
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    language: "en",
  },
  {
    id: "user-004",
    name: "Sara Alaoui",
    email: "sara@atlasfarm.ma",
    role: "manager",
    status: "inactive",
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    language: "fr",
  },
];

export const mockWeather: WeatherDay[] = [
  { day: "Mon", tempHigh: 24, tempLow: 12, humidity: 68, condition: "Sunny", icon: "sun", precipitation: 0 },
  { day: "Tue", tempHigh: 22, tempLow: 11, humidity: 72, condition: "Cloudy", icon: "cloud", precipitation: 10 },
  { day: "Wed", tempHigh: 19, tempLow: 10, humidity: 85, condition: "Rainy", icon: "cloud-rain", precipitation: 45 },
  { day: "Thu", tempHigh: 17, tempLow: 9, humidity: 90, condition: "Rainy", icon: "cloud-rain", precipitation: 60 },
  { day: "Fri", tempHigh: 20, tempLow: 11, humidity: 78, condition: "Partly Cloudy", icon: "cloud-sun", precipitation: 15 },
  { day: "Sat", tempHigh: 23, tempLow: 13, humidity: 65, condition: "Sunny", icon: "sun", precipitation: 0 },
  { day: "Sun", tempHigh: 26, tempLow: 14, humidity: 60, condition: "Sunny", icon: "sun", precipitation: 0 },
];

export const generateChartData = (sensors: SensorData[], days: number) => {
  const labels: string[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString("en", { month: "short", day: "numeric" }));
  }
  return { labels, sensors };
};

export const mockAuditLogs = [
  { id: "log-001", user: "Ahmed Benali", action: "pH Calibration performed", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), ip: "192.168.1.10" },
  { id: "log-002", user: "Fatima Zahra", action: "Alert threshold updated: soil moisture min=35%", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), ip: "192.168.1.12" },
  { id: "log-003", user: "Omar Idrissi", action: "Task created: Irrigation South Field B", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), ip: "192.168.1.15" },
  { id: "log-004", user: "Ahmed Benali", action: "User Sara Alaoui deactivated", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), ip: "192.168.1.10" },
  { id: "log-005", user: "Fatima Zahra", action: "Plot East Field C updated", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), ip: "192.168.1.12" },
];
