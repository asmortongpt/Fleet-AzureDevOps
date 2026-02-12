# Fleet Management System - User Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-31
**Created By**: Agent 10

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Vehicle Management](#vehicle-management)
5. [Virtual Garage 3D](#virtual-garage-3d)
6. [AI Assistant](#ai-assistant)
7. [Admin Features](#admin-features)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Mobile App](#mobile-app)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Fleet Management System is a comprehensive platform for managing your vehicle fleet, drivers, maintenance schedules, and operational analytics.

### Key Features

- **Real-time Vehicle Tracking** - Monitor vehicle location and status
- **3D Virtual Garage** - Visualize vehicles in stunning 3D with 17 camera angles
- **AI-Powered Assistant** - Get instant answers about fleet operations
- **Maintenance Scheduling** - Never miss a service appointment
- **Role-Based Access Control** - Secure permissions for different user types
- **Compliance Monitoring** - Track security and regulatory compliance
- **Advanced Analytics** - Data-driven insights and reports

---

## Getting Started

### Logging In

1. Navigate to the login page
2. Enter your email address
3. Enter your password
4. Click **Login**

**Default Credentials** (Development Only):
- Admin: `admin@fleet.com` / `admin123`
- Manager: `manager@fleet.com` / `manager123`
- Operator: `operator@fleet.com` / `operator123`
- Viewer: `viewer@fleet.com` / `viewer123`

### First-Time Setup

After logging in for the first time:

1. **Update Your Profile** - Click your name in the top right and select "Profile"
2. **Set Up 2FA** - Enable two-factor authentication for security
3. **Tour the Dashboard** - Explore the main features
4. **Check Your Permissions** - Review what features you can access based on your role

---

## Dashboard Overview

The main dashboard provides a comprehensive view of your fleet operations:

### Key Metrics Cards

- **Total Vehicles** - Number of vehicles in your fleet
- **Active Trips** - Currently running trips
- **Maintenance Due** - Vehicles needing service
- **Alerts** - Critical issues requiring attention

### Quick Actions

- **Add Vehicle** - Register a new vehicle
- **Schedule Maintenance** - Book a service appointment
- **View Reports** - Access analytics and insights
- **Manage Drivers** - Add or update driver information

### Recent Activity

View the latest updates across your fleet including:
- Recent trips
- Completed maintenance
- New alerts
- System updates

---

## Vehicle Management

### Viewing Vehicles

**List View:**
1. Click **Vehicles** in the navigation menu
2. Use filters to narrow results (status, type, location)
3. Search by VIN, license plate, or make/model
4. Click any vehicle to see details

**Vehicle Details (Drilldown):**
1. Click a vehicle in the list
2. View comprehensive information:
   - VIN, make, model, year
   - Current mileage and fuel level
   - Assigned driver
   - Service history
   - Trip history
   - Related maintenance records

### Adding a Vehicle

1. Click **Vehicles** → **Add Vehicle**
2. Fill in required fields:
   - VIN (Vehicle Identification Number)
   - Make and Model
   - Year
   - License Plate
   - Vehicle Type (Sedan, SUV, Truck, Van)
3. Optional fields:
   - Department
   - Assigned Driver
   - Purchase Date
   - Initial Mileage
4. Click **Create Vehicle**

### Editing Vehicle Information

1. Navigate to vehicle details
2. Click **Edit** button (requires Manager or Admin role)
3. Update fields as needed
4. Click **Save Changes**

### Vehicle Status Indicators

- 🟢 **Active** - In service and operational
- 🟡 **Maintenance** - Currently being serviced
- 🔴 **Out of Service** - Not operational
- ⚪ **Retired** - No longer in fleet

---

## Virtual Garage 3D

Experience your fleet in stunning 3D visualization!

### Accessing Virtual Garage

1. Click **Virtual Garage** in the main navigation
2. Select a vehicle to view in 3D
3. Use the controls panel on the right side

### Camera Controls (17 Presets)

**Exterior Views:**
- 🎬 **Hero Shot** - Dramatic 3/4 front view
- 📐 **Front Quarter** - 45° front angle
- 📐 **Rear Quarter** - 45° rear angle
- ➡️ **Side Profile** - Pure side view
- ⬆️ **Front View** - Head-on front
- ⬇️ **Rear View** - Straight back
- 🔽 **Top Down** - Bird's eye view
- 📸 **Low Angle** - Ground-level dramatic

**Interior Views:**
- 🪑 **Interior** - Cabin overview
- 🎛️ **Dashboard** - Driver perspective
- 💺 **Back Seat** - Rear passenger view

**Detail Views:**
- ⚙️ **Engine Bay** - Under the hood
- ⭕ **Wheel Detail** - Close-up wheel/tire
- 🔧 **Undercarriage** - Bottom chassis
- 📦 **Trunk/Bed** - Cargo area
- 🔍 **Detail Shot** - Brand/badge closeup

**Special:**
- 🎥 **Cinematic** - Dynamic tracking shot

### Quality Settings

Adjust rendering quality based on your device:
- **Low** - Mobile-optimized (best for phones)
- **Medium** - Balanced (tablets, older laptops)
- **High** - Desktop quality (recommended)
- **Ultra** - Maximum fidelity (high-end GPUs only)

### Showcase Mode

Click **360° Showcase Mode** to:
- Automatically rotate the vehicle
- Cycle through camera angles
- Display in full-screen
- Perfect for presentations

---

## AI Assistant

Your intelligent fleet management companion powered by AI.

### Accessing the AI Assistant

Click **AI Assistant** in the navigation menu

### Quick Actions

Pre-built queries for common tasks:
- **Vehicle Status** - Get current fleet status
- **Maintenance Due** - See upcoming service
- **Fuel Report** - Analyze fuel consumption
- **Safety Alerts** - Review safety issues

### Sample Queries

Try asking:
- "Show me all vehicles due for maintenance"
- "What's the fuel efficiency of Vehicle #123?"
- "Which drivers have safety alerts?"
- "Schedule maintenance for VIN 1FTFW1E50PFA12345"
- "What's the average mileage across my fleet?"

### AI Capabilities

The assistant can help with:
- ✅ Fleet status and analytics
- ✅ Maintenance scheduling
- ✅ Route optimization
- ✅ Fuel cost analysis
- ✅ Safety compliance
- ✅ Driver performance

---

## Admin Features

**Available to Admin role only**

### User Management

**Adding Users:**
1. Navigate to **Admin** → **User Management**
2. Click **Add User**
3. Enter user details:
   - Name
   - Email
   - Role (Admin, Manager, Operator, Viewer)
   - Department
4. Click **Create User**

**Editing Users:**
1. Find user in the table
2. Click **Edit** icon
3. Update information
4. Click **Save Changes**

**Deleting Users:**
1. Find user in the table
2. Click **Delete** icon
3. Confirm deletion

### Security & Compliance

**Compliance Dashboard:**
- View overall compliance score
- Monitor security checks:
  - Password Policy
  - Two-Factor Authentication
  - Data Encryption
  - Access Audit Logs
  - Security Updates

**Security Alerts:**
- View critical security events
- Track failed login attempts
- Monitor unauthorized access attempts
- Review unusual activity patterns

**Access Logs:**
- View all user actions
- Filter by user, action, or resource
- Export logs for auditing
- Track denied access attempts

### System Configuration

**Environment Variables:**
- Manage database connection strings
- Configure API endpoints
- Set JWT secrets
- Update SMTP settings

**Feature Flags:**
- Enable/disable features:
  - 3D Virtual Garage
  - AI Assistant
  - Advanced Analytics
  - Mobile App
  - Strict RBAC

**System Health:**
- Monitor component status:
  - Database
  - Redis Cache
  - API Server
  - Storage
  - Email Service

**Backup & Restore:**
- Export system configuration
- Import configuration files
- Create database backups
- Reset to default settings

---

## User Roles & Permissions

### Admin
**Full System Access**
- ✅ View all data
- ✅ Create, edit, delete anything
- ✅ Manage users
- ✅ Access settings
- ✅ View all reports
- ✅ Export data
- ✅ Manage fleet
- ✅ Assign vehicles
- ✅ Schedule maintenance

### Manager
**Fleet Management**
- ✅ View all data
- ✅ Create new records
- ✅ Edit all records
- ✅ Delete own records
- ❌ Manage users
- ❌ Access settings
- ✅ View reports
- ✅ Export data
- ✅ Manage fleet
- ✅ Assign vehicles
- ✅ Schedule maintenance

### Operator
**Daily Operations**
- ✅ View all data
- ✅ Edit own records
- ❌ Create records
- ❌ Delete records
- ❌ Manage users
- ❌ Access settings
- ✅ View reports
- ❌ Export data
- ❌ Manage fleet
- ❌ Assign vehicles
- ✅ Schedule maintenance

### Viewer
**Read-Only Access**
- ✅ View vehicles, trips, reports
- ❌ Edit anything
- ❌ Create anything
- ❌ Delete anything
- ❌ All admin features

---

## Mobile App

Access fleet management on the go!

### Features

- View vehicle status
- Track real-time location
- Receive push notifications for alerts
- Schedule maintenance
- Log trips
- Scan vehicle QR codes

### Installation

**iOS:**
1. Open App Store
2. Search "Fleet Management"
3. Install and open
4. Login with your credentials

**Android:**
1. Open Google Play Store
2. Search "Fleet Management"
3. Install and open
4. Login with your credentials

### Mobile-Optimized Features

- Responsive design adapts to phone screens
- Touch-friendly buttons and gestures
- Offline mode for viewing cached data
- GPS integration for location tracking

---

## Troubleshooting

### Common Issues

**Can't Log In**
- Verify email and password are correct
- Check Caps Lock is off
- Try "Forgot Password" link
- Contact admin if account is locked

**Vehicle Not Showing**
- Check filters aren't hiding it
- Verify you have permission to view
- Try refreshing the page
- Search by VIN or license plate

**3D Viewer Not Loading**
- Check internet connection
- Try lowering quality setting
- Update your browser
- Enable WebGL in browser settings

**AI Assistant Not Responding**
- Verify internet connection
- Try refreshing the page
- Check server status
- Contact support if persists

### Getting Help

- **Help Center**: Click ? icon in top right
- **Email Support**: support@fleet.com
- **Phone**: 1-800-FLEET-HELP
- **Documentation**: https://docs.fleet.com

---

## Best Practices

1. **Keep Data Updated** - Regularly update vehicle mileage and status
2. **Review Alerts Daily** - Don't miss critical issues
3. **Schedule Proactively** - Book maintenance before it's overdue
4. **Use Filters** - Make large datasets manageable
5. **Enable 2FA** - Protect your account
6. **Export Backups** - Regularly backup important data
7. **Train Your Team** - Ensure all users know their role

---

**Need More Help?** Contact support@fleet.com or visit our Help Center.

**Generated with [Claude Code](https://claude.com/claude-code)**
