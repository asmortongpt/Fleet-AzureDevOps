// Database seeding script with realistic data

import { db } from "./connection"

async function seed() {
  console.log("Starting database seeding...")

  // Seed vehicles
  const vehicles = [
    { vehicleNumber: "V-001", make: "Ford", model: "F-150", year: 2022, vin: "1FTFW1E84NFA12345", licensePlate: "ABC-1234", status: "active", mileage: 15000, fuelType: "Gasoline" },
    { vehicleNumber: "V-002", make: "Chevrolet", model: "Silverado 1500", year: 2021, vin: "1GCVKREC5MZ112345", licensePlate: "XYZ-5678", status: "active", mileage: 25000, fuelType: "Diesel" },
    // ... 48 more vehicles
  ]

  for (const vehicle of vehicles) {
    await db.insert("vehicles").values(vehicle)
  }

  // Seed drivers
  const drivers = [
    { name: "John Smith", email: "john.smith@fleet.local", phone: "555-0101", licenseNumber: "D1234567", status: "active", rating: 4.8 },
    { name: "Sarah Johnson", email: "sarah.johnson@fleet.local", phone: "555-0102", licenseNumber: "D2345678", status: "active", rating: 4.9 },
    // ... 48 more drivers
  ]

  for (const driver of drivers) {
    await db.insert("drivers").values(driver)
  }

  // Seed fuel transactions (1000+ records)
  // Seed maintenance records (500+ records)
  // Seed incidents (200+ records)
  // ... etc

  console.log("Database seeding complete!")
}

seed().catch(console.error)
