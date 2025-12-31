/**
 * Demo API Routes - Unauthenticated endpoints for development
 * 
 * These endpoints return realistic mock data without requiring authentication.
 * IMPORTANT: Disable in production by checking NODE_ENV
 */
import { Router, Request, Response } from 'express';

const router = Router();

// Only enable demo routes in development
if (process.env.NODE_ENV !== 'production') {

    // Realistic Tallahassee Fleet demo data
    const demoVehicles = [
        { id: 1, vin: '1FTEW1EP0KFA12345', make: 'Ford', model: 'F-150', year: 2023, status: 'active', license_plate: 'TLH-001', odometer: 42350, fuel_type: 'gasoline', department: 'Public Works' },
        { id: 2, vin: '1GC1KUEY8LF123456', make: 'Chevrolet', model: 'Silverado 2500HD', year: 2022, status: 'active', license_plate: 'TLH-002', odometer: 67890, fuel_type: 'diesel', department: 'Utilities' },
        { id: 3, vin: '3C6UR5CL9LG123789', make: 'RAM', model: '2500', year: 2023, status: 'maintenance', license_plate: 'TLH-003', odometer: 38500, fuel_type: 'diesel', department: 'Parks & Rec' },
        { id: 4, vin: '1FTEW1E59LFA98765', make: 'Ford', model: 'F-250', year: 2021, status: 'active', license_plate: 'TLH-004', odometer: 89200, fuel_type: 'gasoline', department: 'Fleet Services' },
        { id: 5, vin: '1GCVKNEC2LZ456789', make: 'Chevrolet', model: 'Express 3500', year: 2022, status: 'active', license_plate: 'TLH-005', odometer: 54100, fuel_type: 'gasoline', department: 'IT Services' },
        { id: 6, vin: '1FTNF1EF3LKB11111', make: 'Ford', model: 'F-150 Lightning', year: 2024, status: 'active', license_plate: 'TLH-006', odometer: 12400, fuel_type: 'electric', department: 'Admin' },
        { id: 7, vin: '5TFDW5F17LX222222', make: 'Toyota', model: 'Tundra', year: 2023, status: 'inactive', license_plate: 'TLH-007', odometer: 28700, fuel_type: 'gasoline', department: 'Code Enforcement' },
        { id: 8, vin: 'JTEBU5JR5L5333333', make: 'Toyota', model: '4Runner', year: 2022, status: 'active', license_plate: 'TLH-008', odometer: 45600, fuel_type: 'gasoline', department: 'Planning' },
    ];

    const demoDrivers = [
        { id: 1, first_name: 'Marcus', last_name: 'Johnson', email: 'mjohnson@city.gov', license_number: 'J123456789', license_expiry: '2026-08-15', phone: '850-555-0101', department: 'Public Works', status: 'active', safety_score: 94 },
        { id: 2, first_name: 'Sarah', last_name: 'Williams', email: 'swilliams@city.gov', license_number: 'W987654321', license_expiry: '2025-11-22', phone: '850-555-0102', department: 'Utilities', status: 'active', safety_score: 98 },
        { id: 3, first_name: 'David', last_name: 'Chen', email: 'dchen@city.gov', license_number: 'C456789123', license_expiry: '2026-03-10', phone: '850-555-0103', department: 'Parks & Rec', status: 'active', safety_score: 91 },
        { id: 4, first_name: 'Emily', last_name: 'Rodriguez', email: 'erodriguez@city.gov', license_number: 'R789123456', license_expiry: '2025-07-08', phone: '850-555-0104', department: 'Fleet Services', status: 'active', safety_score: 96 },
        { id: 5, first_name: 'James', last_name: 'Thompson', email: 'jthompson@city.gov', license_number: 'T321654987', license_expiry: '2026-01-28', phone: '850-555-0105', department: 'IT Services', status: 'on_leave', safety_score: 89 },
    ];

    // Demo vehicles endpoint
    router.get('/vehicles', (_req: Request, res: Response) => {
        res.json({ data: demoVehicles, total: demoVehicles.length });
    });

    // Demo drivers endpoint
    router.get('/drivers', (_req: Request, res: Response) => {
        res.json({ data: demoDrivers, total: demoDrivers.length });
    });

    // Demo maintenance endpoint
    router.get('/maintenance', (_req: Request, res: Response) => {
        res.json({
            data: [
                { id: 1, vehicle_id: 3, type: 'Oil Change', status: 'in_progress', scheduled_date: '2025-01-02', technician: 'Mike Rivera' },
                { id: 2, vehicle_id: 1, type: 'Tire Rotation', status: 'scheduled', scheduled_date: '2025-01-05', technician: 'Lisa Park' },
                { id: 3, vehicle_id: 2, type: 'Brake Inspection', status: 'scheduled', scheduled_date: '2025-01-08', technician: 'Mike Rivera' },
            ], total: 3
        });
    });

    // Demo fuel transactions endpoint
    router.get('/fuel-transactions', (_req: Request, res: Response) => {
        res.json({
            data: [
                { id: 1, vehicle_id: 1, driver_id: 1, gallons: 18.5, cost: 63.87, date: '2024-12-28', location: 'Shell - Apalachee Pkwy' },
                { id: 2, vehicle_id: 2, driver_id: 2, gallons: 24.2, cost: 98.42, date: '2024-12-29', location: 'Circle K - Monroe St' },
                { id: 3, vehicle_id: 4, driver_id: 4, gallons: 21.0, cost: 72.45, date: '2024-12-30', location: 'Costco - Capital Circle' },
            ], total: 3
        });
    });

    console.log('[DEMO] Demo API routes enabled at /api/demo/*');
}

export default router;
