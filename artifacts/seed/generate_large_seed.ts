import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Constants & Data Pools ---

const TENANT_NAME = "Capital Tech Alliance";
const TENANT_SLUG = "capital-tech";
const TENANT_DOMAIN = "capitaltechalliance.com";
const TENANT_ID = "a0000000-0000-0000-0000-000000000001";

const FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth",
    "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
    "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
    "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah",
    "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia",
    "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen",
    "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
    "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel",
    "Patrick", "Catherine", "Raymond", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria"
];

const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
    "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
    "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
    "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
    "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
    "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes"
];

const VEHICLE_MODELS = [
    { make: "Ford", model: "F-150", type: "truck", fuel: "gasoline" },
    { make: "Chevrolet", model: "Silverado", type: "truck", fuel: "diesel" },
    { make: "Toyota", model: "Camry", type: "sedan", fuel: "hybrid" },
    { make: "Honda", model: "Accord", type: "sedan", fuel: "gasoline" },
    { make: "Ford", model: "Transit", type: "van", fuel: "gasoline" },
    { make: "Tesla", model: "Model 3", type: "sedan", fuel: "electric" },
    { make: "Tesla", model: "Model Y", type: "suv", fuel: "electric" },
    { make: "Ford", model: "F-150 Lightning", type: "truck", fuel: "electric" },
    { make: "Rivian", model: "R1T", type: "truck", fuel: "electric" },
    { make: "Mack", model: "Anthem", type: "construction", fuel: "diesel" }
];

const FACILITIES = [
    {
        name: "Capital Tech HQ Fleet Center",
        address: "1500 Capital Circle SE",
        city: "Tallahassee",
        state: "FL",
        zip_code: "32301",
        type: "garage",
        capacity: 50
    },
    {
        name: "Northside Depot",
        address: "3200 North Monroe Street",
        city: "Tallahassee",
        state: "FL",
        zip_code: "32303",
        type: "depot",
        capacity: 25
    },
    {
        name: "Southside Service Center",
        address: "4500 Woodville Highway",
        city: "Tallahassee",
        state: "FL",
        zip_code: "32305",
        type: "service_center",
        capacity: 30
    }
];

// --- Generators ---

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateVin() {
    const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
    let vin = "";
    for (let i = 0; i < 11; i++) vin += chars.charAt(Math.floor(Math.random() * chars.length));
    // Ensure unique suffix for last 6
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return vin + suffix;
}

function generateUsers(count: number, role: 'Admin' | 'Manager' | 'Driver' | 'Mechanic', startIdx: number) {
    const users = [];
    for (let i = 0; i < count; i++) {
        const firstName = randomItem(FIRST_NAMES);
        const lastName = randomItem(LAST_NAMES);
        // Ensure unique email
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${startIdx + i}@${TENANT_DOMAIN}`;

        users.push({
            email,
            password_hash: "$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa", // Fleet@2026
            first_name: firstName,
            last_name: lastName,
            role,
            tenant_slug: TENANT_SLUG,
            is_driver: role === 'Driver', // Flag to create driver record later
            phone: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}`
        });
    }
    return users;
}

// --- Detailed Generators ---

function generateVehicles(count: number) {
    const vehicles = [];
    for (let i = 0; i < count; i++) {
        const modelInfo = randomItem(VEHICLE_MODELS);
        const vin = generateVin();
        const year = randomInt(2018, 2025);
        const purchaseDate = new Date(Date.now() - Math.random() * 157784630000).toISOString(); // 5 years max
        const msrp = randomInt(35000, 95000);

        vehicles.push({
            vin,
            make: modelInfo.make,
            model: modelInfo.model,
            year,
            trim: ["XL", "XLT", "Lariat", "Platinum", "Base", "Performance", "Long Range"][randomInt(0, 6)],
            license_plate: `FL-${5000 + i}`,
            type: modelInfo.type,
            status: Math.random() > 0.9 ? 'maintenance' : 'active',
            fuel_type: modelInfo.fuel,
            odometer: randomInt(1000, 150000),
            tenant_slug: TENANT_SLUG,

            // Detailed Specs
            color: ["Summit White", "Agate Black", "Race Red", "Velocity Blue", "Iconic Silver", "Carbonized Gray"][randomInt(0, 5)],
            transmission: modelInfo.fuel === 'electric' ? 'Single-Speed' : '10-Speed Automatic',
            drive_train: ["RWD", "AWD", "4WD"][randomInt(0, 2)],
            engine_summary: modelInfo.fuel === 'electric' ? 'Dual Motor' : '3.5L V6 EcoBoost',

            // Dimensions & Weights
            gross_vehicle_weight_rating_lbs: randomInt(6000, 14000),
            curb_weight_lbs: randomInt(4000, 8000),
            length_inches: randomInt(190, 250),
            width_inches: randomInt(75, 96),
            height_inches: randomInt(65, 85),
            wheelbase_inches: randomInt(120, 160),
            towing_capacity_lbs: randomInt(5000, 14000),
            payload_capacity_lbs: randomInt(1500, 4000),

            // Capabilities (Tank/Battery)
            tank_capacity_gal: modelInfo.fuel === 'electric' ? 0 : randomInt(20, 36),
            battery_capacity_kwh: modelInfo.fuel === 'electric' ? randomInt(75, 131) : 0,
            range_miles: modelInfo.fuel === 'electric' ? randomInt(250, 400) : randomInt(400, 700),

            // Lifecycle
            purchase_date: purchaseDate,
            purchase_price: msrp,
            current_value: Math.floor(msrp * 0.85),
            warranty_expiration_date: new Date(new Date(purchaseDate).getTime() + 94608000000).toISOString(), // +3 years

            // Registration
            registration_expiration_date: new Date(Date.now() + Math.random() * 31536000000).toISOString(),
            insurance_provider: "Progressive Fleet",
            insurance_policy_number: `POL-${randomInt(100000, 999999)}`,

            // Telemetry Config
            telemetry_provider: "Geotab",
            telemetry_device_id: `GO9-${randomInt(10000, 99999)}`,

            // Features
            features: ["Bluetooth", "Backup Camera", "Lane Keep Assist", "Telematics"],
            notes: "Assigned to Tallahassee Regional Operations"
        });
    }
    return vehicles;
}

function generateParts(count: number) {
    const parts = [];
    const CATEGORIES = ["filters", "parts", "tires", "fluids", "batteries", "parts", "electrical"];

    for (let i = 0; i < count; i++) {
        const category = randomItem(CATEGORIES);
        const modelInfo = randomItem(VEHICLE_MODELS);

        parts.push({
            part_number: `${category.substring(0, 3).toUpperCase()}-${randomInt(1000, 9999)}`,
            name: `${modelInfo.make} ${modelInfo.model} ${category} Kit`,
            description: `OEM replacement ${category.toLowerCase()} for 2020+ ${modelInfo.make} ${modelInfo.model}`,
            category: category,
            manufacturer: ["Motorcraft", "ACDelco", "Bosch", "Michelin", "NAPA"][randomInt(0, 4)],

            unit_cost: randomInt(15, 250) + 0.99,
            list_price: 0, // calculated later

            quantity_on_hand: randomInt(0, 50),
            minimum_quantity: randomInt(5, 10),
            reorder_quantity: 20,

            bin_location: `Aisle ${randomInt(1, 5)}-Shelf ${randomInt(1, 8)}`,

            compatible_makes: [modelInfo.make],
            compatible_models: [modelInfo.model],
            compatible_years: ["2018", "2019", "2020", "2021", "2022", "2023"],

            tenant_slug: TENANT_SLUG
        });
        // Set list price
        parts[i].list_price = parts[i].unit_cost * 1.4;
    }
    return parts;
}

// --- Derived Data Generators ---

function generateFacilities() {
    return FACILITIES.map((f, i) => ({
        ...f,
        tenant_slug: TENANT_SLUG,
        id: `a0000000-0000-0000-0003-00000000000${i + 1}` // predictable IDs
    }));
}

function generateFuelTransactions(vehicles: any[], count: number) {
    const transactions = [];
    for (let i = 0; i < count; i++) {
        const vehicle = randomItem(vehicles);
        transactions.push({
            vehicle_vin: vehicle.vin,
            date: new Date(Date.now() - Math.random() * 15552000000).toISOString(), // Last 6 months
            gallons: (10 + Math.random() * 15).toFixed(2),
            price_per_gallon: (3.00 + Math.random()).toFixed(2),
            odometer: vehicle.odometer - Math.floor(Math.random() * 5000),
            fuel_type: vehicle.fuel_type,
            location: "Tallahassee, FL",
            tenant_slug: TENANT_SLUG
        });
    }
    return transactions;
}

function generateMaintenanceSchedules(vehicles: any[]) {
    const schedules = [];
    for (const v of vehicles) {
        if (Math.random() > 0.3) { // 70% of vehicles have a schedule
            schedules.push({
                vehicle_vin: v.vin,
                name: "Oil Change & Inspection",
                type: "preventive",
                interval_miles: 5000,
                last_service_date: new Date(Date.now() - Math.random() * 7776000000).toISOString(), // Last 3 months
                last_service_mileage: v.odometer - randomInt(500, 4000),
                tenant_slug: TENANT_SLUG
            });
        }
    }
    return schedules;
}

function generateWorkOrders(vehicles: any[]) {
    const orders = [];
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
    for (const v of maintenanceVehicles) {
        orders.push({
            vehicle_vin: v.vin,
            type: "corrective",
            priority: "high",
            status: "in_progress",
            title: "Engine Issue",
            description: "Engine check light on / Strange noise",
            reported_at: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
            tenant_slug: TENANT_SLUG
        });
    }
    return orders;
}

function generateIncidents(vehicles: any[], drivers: any[]) {
    const incidents = [];
    for (let i = 0; i < 8; i++) {
        const v = randomItem(vehicles);
        const d = randomItem(drivers);
        incidents.push({
            vehicle_vin: v.vin,
            driver_email: d.email,
            date: new Date(Date.now() - Math.random() * 15552000000).toISOString(),
            type: "Collision", // Warning: schema enum might be specific? ("collision"?)
            severity: "moderate",
            description: "Minor fender bender in parking lot",
            status: "pending", // Schema has 'pending', 'investigating' might not be in enum?
            tenant_slug: TENANT_SLUG
        });
    }
    return incidents;
}

// --- Main Execution ---

const tenants = [
    {
        id: TENANT_ID,
        name: TENANT_NAME,
        slug: TENANT_SLUG,
        domain: TENANT_DOMAIN,
        plan: "enterprise"
    }
];

// 250 Staff
const admins = generateUsers(2, 'Admin', 0);
const managers = generateUsers(8, 'Manager', 2);
const technicians = generateUsers(20, 'Mechanic', 10);
const drivers = generateUsers(220, 'Driver', 30);
const users = [...admins, ...managers, ...technicians, ...drivers];

// 100 Vehicles
const vehicles = generateVehicles(100);

// Facilities
const facilities = generateFacilities();

// Transactions & Records
const fuel_transactions = generateFuelTransactions(vehicles, 450);
const maintenance_schedules = generateMaintenanceSchedules(vehicles);
const work_orders = generateWorkOrders(vehicles);
const incidents = generateIncidents(vehicles, drivers);
const parts = generateParts(500); // 500 catalog items

// Compile full JSON
const seedData = {
    tenants,
    users,
    vehicles,
    facilities,
    fuel_transactions,
    maintenance_schedules,
    work_orders,
    incidents,
    parts
};

const outputPath = path.join(__dirname, 'seed_data_definition.json');
fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 4));

console.log(`✅ Generated seed data with:
- ${tenants.length} Tenant
- ${users.length} Users
- ${vehicles.length} Vehicles
- ${facilities.length} Facilities
- ${fuel_transactions.length} Fuel Tx
- ${maintenance_schedules.length} Maint. Schedules
- ${work_orders.length} Work Orders
- ${incidents.length} Incidents
- ${parts.length} Parts
Saved to: ${outputPath}
`);
