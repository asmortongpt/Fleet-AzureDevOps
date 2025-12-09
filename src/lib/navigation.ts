import {
  Gauge,
  BarChart,
  Users,
  Wrench,
  Fuel,
  Map,
  Camera,
  FileText,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  section: "main" | "management" | "tools";
}

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge, path: "/dashboard", section: "main" },
  { id: "executive-dashboard", label: "Executive Dashboard", icon: BarChart, path: "/executive-dashboard", section: "main" },
  { id: "admin-dashboard", label: "Admin Dashboard", icon: Settings, path: "/admin-dashboard", section: "main" },
  { id: "people", label: "People", icon: Users, path: "/people", section: "management" },
  { id: "garage", label: "Garage", icon: Wrench, path: "/garage", section: "management" },
  { id: "fuel", label: "Fuel", icon: Fuel, path: "/fuel", section: "management" },
  { id: "gps-tracking", label: "GPS Tracking", icon: Map, path: "/gps-tracking", section: "management" },
  { id: "traffic-cameras", label: "Traffic Cameras", icon: Camera, path: "/traffic-cameras", section: "tools" },
  { id: "reports", label: "Reports", icon: FileText, path: "/reports", section: "tools" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings", section: "tools" },
  { id: "profile", label: "Profile", icon: User, path: "/profile", section: "tools" },
];
