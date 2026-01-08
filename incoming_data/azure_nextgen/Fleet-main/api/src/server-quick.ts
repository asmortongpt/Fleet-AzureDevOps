/**
 * Quick Start Express Server - Fleet Management API
 * SQLite-based server with mock data
 */

import cors from "cors";
import express from "express";
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://172.173.175.71:8080", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

// Mock data
const mockVehicles = [
  { id: "1", make: "Ford", model: "F-150", year: 2022, vin: "1FTFW1E89MKE12345", status: "active", licensePlate: "ABC123", mileage: 45000 },
  { id: "2", make: "Chevrolet", model: "Silverado", year: 2021, vin: "1GCUYDED5MZ123456", status: "active", licensePlate: "XYZ789", mileage: 52000 },
  { id: "3", make: "Ram", model: "1500", year: 2023, vin: "1C6SRFFT4NN123457", status: "maintenance", licensePlate: "DEF456", mileage: 12000 },
  { id: "4", make: "Toyota", model: "Tacoma", year: 2022, vin: "3TMCZ5AN9NM123458", status: "active", licensePlate: "GHI789", mileage: 38000 },
  { id: "5", make: "GMC", model: "Sierra", year: 2021, vin: "1GTU9EED5MZ123459", status: "active", licensePlate: "JKL012", mileage: 61000 },
];

const mockDrivers = [
  { id: "1", name: "John Smith", licenseNumber: "D1234567", status: "active", email: "john.smith@fleet.com", phone: "555-0101" },
  { id: "2", name: "Sarah Johnson", licenseNumber: "D2345678", status: "active", email: "sarah.johnson@fleet.com", phone: "555-0102" },
  { id: "3", name: "Mike Davis", licenseNumber: "D3456789", status: "on_leave", email: "mike.davis@fleet.com", phone: "555-0103" },
  { id: "4", name: "Emily Wilson", licenseNumber: "D4567890", status: "active", email: "emily.wilson@fleet.com", phone: "555-0104" },
];

const mockWorkOrders = [
  { id: "1", vehicleId: "1", description: "Oil change and tire rotation", status: "completed", priority: "normal", createdAt: "2025-01-01", completedAt: "2025-01-02" },
  { id: "2", vehicleId: "3", description: "Brake pad replacement", status: "in_progress", priority: "high", createdAt: "2025-01-02", completedAt: null },
  { id: "3", vehicleId: "2", description: "Air filter replacement", status: "pending", priority: "low", createdAt: "2025-01-03", completedAt: null },
];

const mockFuelTransactions = [
  { id: "1", vehicleId: "1", gallons: 18.5, cost: 66.60, odometer: 45000, date: "2025-01-01", location: "Shell Station" },
  { id: "2", vehicleId: "2", gallons: 22.0, cost: 79.20, odometer: 52000, date: "2025-01-01", location: "BP Station" },
  { id: "3", vehicleId: "4", gallons: 15.2, cost: 54.72, odometer: 38000, date: "2025-01-02", location: "Chevron" },
];

const mockRoutes = [
  { id: "1", name: "Downtown Delivery", description: "Main downtown route", status: "active", distance: 45.5 },
  { id: "2", name: "Airport Shuttle", description: "Airport to downtown", status: "active", distance: 23.2 },
  { id: "3", name: "Warehouse Circuit", description: "Warehouse distribution route", status: "active", distance: 67.8 },
];

const mockFacilities = [
  { id: "1", name: "Main Depot", address: "123 Fleet St", city: "Austin", state: "TX", zip: "78701", type: "garage" },
  { id: "2", name: "North Station", address: "456 Oak Ave", city: "Austin", state: "TX", zip: "78758", type: "parking" },
];

const mockInspections = [
  { id: "1", vehicleId: "1", inspectorName: "Bob Smith", status: "passed", date: "2025-01-01", notes: "All systems operational" },
  { id: "2", vehicleId: "3", inspectorName: "Alice Jones", status: "failed", date: "2025-01-02", notes: "Brake issues found" },
];

const mockIncidents = [
  { id: "1", vehicleId: "2", driverId: "2", description: "Minor fender bender", severity: "minor", date: "2024-12-28", status: "resolved" },
];

const mockGpsTracks = [
  { id: "1", vehicleId: "1", latitude: 30.2672, longitude: -97.7431, speed: 45, heading: 180, timestamp: "2025-01-02T10:00:00Z" },
  { id: "2", vehicleId: "1", latitude: 30.2665, longitude: -97.7425, speed: 48, heading: 185, timestamp: "2025-01-02T10:01:00Z" },
  { id: "3", vehicleId: "2", latitude: 30.3072, longitude: -97.7531, speed: 52, heading: 90, timestamp: "2025-01-02T10:00:00Z" },
];

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "sqlite",
  });
});

// API endpoints
app.get("/api/vehicles", (req, res) => {
  res.json({ data: mockVehicles, meta: { total: mockVehicles.length } });
});

app.get("/api/vehicles/:id", (req, res) => {
  const vehicle = mockVehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  res.json(vehicle);
});

app.get("/api/drivers", (req, res) => {
  res.json({ data: mockDrivers, meta: { total: mockDrivers.length } });
});

app.get("/api/work-orders", (req, res) => {
  res.json({ data: mockWorkOrders, meta: { total: mockWorkOrders.length } });
});

app.get("/api/fuel-transactions", (req, res) => {
  res.json({ data: mockFuelTransactions, meta: { total: mockFuelTransactions.length } });
});

app.get("/api/routes", (req, res) => {
  res.json({ data: mockRoutes, meta: { total: mockRoutes.length } });
});

app.get("/api/facilities", (req, res) => {
  res.json({ data: mockFacilities, meta: { total: mockFacilities.length } });
});

app.get("/api/inspections", (req, res) => {
  res.json({ data: mockInspections, meta: { total: mockInspections.length } });
});

app.get("/api/incidents", (req, res) => {
  res.json({ data: mockIncidents, meta: { total: mockIncidents.length } });
});

app.get("/api/gps-tracks", (req, res) => {
  const { vehicleId } = req.query;
  let tracks = mockGpsTracks;
  if (vehicleId) {
    tracks = tracks.filter(t => t.vehicleId === vehicleId);
  }
  res.json({ data: tracks, meta: { total: tracks.length } });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=".repeat(60));
  console.log("🚀 Fleet Management API Server (Quick Start)");
  console.log("=".repeat(60));
  console.log("");
  console.log(`📡 Server running on: http://172.173.175.71:${PORT}`);
  console.log(`🏥 Health check: http://172.173.175.71:${PORT}/health`);
  console.log("");
  console.log("📊 Available endpoints:");
  console.log("   GET  /api/vehicles");
  console.log("   GET  /api/drivers");
  console.log("   GET  /api/work-orders");
  console.log("   GET  /api/fuel-transactions");
  console.log("   GET  /api/routes");
  console.log("   GET  /api/facilities");
  console.log("   GET  /api/inspections");
  console.log("   GET  /api/incidents");
  console.log("   GET  /api/gps-tracks");
  console.log("");
  console.log("✅ Mock data loaded and ready!");
  console.log("");
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
