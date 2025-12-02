/**
 * Radio Traffic & Task Management Emulator
 * Generates realistic radio transmissions, incidents, and task assignments
 * for City of Tallahassee Fleet Management System
 */

import { Pool, PoolClient } from 'pg';

interface RadioUnit {
  id: string;
  vehicleId: string;
  radioId: string;
  callSign: string;
  department: string;
  unitType: string;
  frequency: string;
  status: 'available' | 'dispatched' | 'on_scene' | 'unavailable' | 'out_of_service';
  currentLocationLat: number;
  currentLocationLng: number;
}

interface RadioIncident {
  id: string;
  incidentNumber: string;
  incidentType: string;
  priority: number;
  status: string;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  description: string;
  unitsAssigned: string[];
}

interface Task {
  id: string;
  taskNumber: string;
  taskType: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  assignedToDriverId: string | null;
  assignedToVehicleId: string | null;
  assignedToRadioUnitId: string | null;
}

export class RadioTrafficEmulator {
  private pool: Pool;
  private radioUnits: Map<string, RadioUnit> = new Map();
  private activeIncidents: Map<string, RadioIncident> = new Map();
  private activeTasks: Map<string, Task> = new Map();
  private incidentCounter = 1;
  private taskCounter = 1;

  // Tallahassee street addresses for incidents
  private tallahasseeLocations = [
    { address: '100 N Monroe St', lat: 30.4383, lng: -84.2807 },
    { address: '435 N Macomb St', lat: 30.4420, lng: -84.2818 },
    { address: '1940 N Monroe St', lat: 30.4650, lng: -84.2807 },
    { address: '2415 N Monroe St', lat: 30.4800, lng: -84.2807 },
    { address: '1500 Capital Circle NE', lat: 30.4500, lng: -84.2500 },
    { address: '2727 W Tennessee St', lat: 30.4420, lng: -84.3200 },
    { address: '1818 S Adams St', lat: 30.4100, lng: -84.2800 },
    { address: '1500 Metropolitan Blvd', lat: 30.4900, lng: -84.2400 },
    { address: '3117 Capital Circle NE', lat: 30.5000, lng: -84.2300 },
    { address: '1991 Apalachee Pkwy', lat: 30.4250, lng: -84.2400 },
    { address: '2810 Sharer Rd', lat: 30.5100, lng: -84.3100 },
    { address: '1000 Orange Ave', lat: 30.4350, lng: -84.2900 },
    { address: '2505 Summit Lake Dr', lat: 30.5200, lng: -84.2200 },
    { address: '1410 Market St', lat: 30.4500, lng: -84.2700 },
    { address: '3300 Thomasville Rd', lat: 30.5100, lng: -84.2650 }
  ];

  // Incident types by department
  private incidentTypes = {
    police: [
      'Traffic Stop', 'Suspicious Activity', 'Domestic Disturbance', 'Burglary',
      'Vehicle Accident', 'Welfare Check', 'Noise Complaint', 'Theft Report',
      'Assault', 'Trespassing', 'Public Intoxication', 'Missing Person'
    ],
    fire: [
      'Structure Fire', 'Vehicle Fire', 'Brush Fire', 'Smoke Investigation',
      'Hazmat Incident', 'Fire Alarm', 'Gas Leak', 'Carbon Monoxide Alarm',
      'Electrical Fire', 'Dumpster Fire', 'False Alarm', 'Mutual Aid Request'
    ],
    ems: [
      'Medical Emergency', 'Cardiac Arrest', 'Respiratory Distress', 'Trauma',
      'Fall Victim', 'Unconscious Person', 'Seizure', 'Diabetic Emergency',
      'Overdose', 'Stroke', 'Allergic Reaction', 'Chest Pain'
    ],
    publicWorks: [
      'Water Main Break', 'Sewer Backup', 'Road Debris', 'Pothole Repair',
      'Storm Damage', 'Tree Down', 'Street Light Out', 'Sign Down',
      'Drainage Issue', 'Pavement Failure', 'Utility Locate', 'Right-of-Way Issue'
    ],
    utilities: [
      'Power Outage', 'Gas Leak', 'Water Service Issue', 'Meter Reading',
      'Equipment Malfunction', 'Line Down', 'Transformer Issue', 'Service Disconnect',
      'Emergency Shutoff', 'Restoration Work', 'Planned Outage', 'Underground Cable Issue'
    ]
  };

  // Task types
  private taskTypes = {
    route: ['Waste Collection Route', 'Transit Route', 'Patrol Route', 'Inspection Route'],
    pickup: ['Equipment Pickup', 'Supply Pickup', 'Vehicle Pickup', 'Parts Pickup'],
    delivery: ['Material Delivery', 'Equipment Delivery', 'Document Delivery', 'Supply Delivery'],
    inspection: ['Facility Inspection', 'Equipment Inspection', 'Safety Inspection', 'Site Inspection'],
    maintenance: ['Scheduled Maintenance', 'Emergency Repair', 'Preventive Maintenance', 'Equipment Service'],
    emergency: ['Emergency Response', 'Urgent Repair', 'Critical Service', 'Immediate Assistance']
  };

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'fleet-postgres-service',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'fleetdb',
      user: process.env.DB_USER || 'fleetadmin',
      password: process.env.DB_PASSWORD || 'fleet2024!',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('🎙️ Radio Traffic Emulator initialized');
  }

  async initialize(): Promise<void> {
    console.log('📡 Initializing radio units...');
    await this.createRadioUnits();
    await this.loadExistingRadioUnits();

    console.log('🚨 Starting emulation loops...');
    this.startRadioTrafficEmulation();
    this.startIncidentEmulation();
    this.startTaskEmulation();
    this.startDispatchLogEmulation();
  }

  /**
   * Create radio units for all vehicles in the database
   */
  private async createRadioUnits(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Get all vehicles from the database
      const vehiclesResult = await client.query(`
        SELECT id, make, model, year, license_plate, vehicle_type
        FROM vehicles
        WHERE status != 'decommissioned' OR status IS NULL
        ORDER BY make, model
      `);

      console.log(`📻 Creating radio units for ${vehiclesResult.rows.length} vehicles`);

      const radioChannels: Record<string, string> = {
        'police': '155.370',
        'fire': '154.280',
        'publicWorks': '151.115',
        'transit': '452.900',
        'utilities': '151.280',
        'parks': '151.490'
      };

      const unitTypes: Record<string, string[]> = {
        'police': ['patrol', 'supervisor', 'detective', 'k9', 'traffic'],
        'fire': ['engine', 'ladder', 'rescue', 'chief', 'hazmat'],
        'publicWorks': ['truck', 'supervisor', 'equipment', 'crew'],
        'transit': ['bus', 'paratransit', 'supervisor'],
        'utilities': ['service', 'emergency', 'supervisor', 'crew'],
        'parks': ['maintenance', 'supervisor', 'equipment']
      };

      // Function to assign department based on vehicle characteristics
      const assignDepartment = (vehicle: any): string => {
        const model = (vehicle.model || '').toLowerCase();
        const make = (vehicle.make || '').toLowerCase();
        const vType = (vehicle.vehicle_type || '').toLowerCase();

        // Fire department vehicles
        if (model.includes('fire') || make.includes('pierce') || make.includes('seagrave') ||
            vType.includes('fire') || model.includes('ladder') || model.includes('pumper')) {
          return 'fire';
        }

        // Police vehicles
        if (model.includes('police') || model.includes('patrol') || model.includes('explorer') ||
            model.includes('charger') || model.includes('tahoe') || vType.includes('police')) {
          return 'police';
        }

        // Transit (buses)
        if (model.includes('bus') || make.includes('gillig') || make.includes('nova') ||
            vType.includes('bus') || vType.includes('transit')) {
          return 'transit';
        }

        // Utilities vehicles
        if (model.includes('bucket') || model.includes('utility') || make.includes('altec') ||
            vType.includes('utility')) {
          return 'utilities';
        }

        // Parks vehicles
        if (model.includes('mower') || model.includes('tractor') || vType.includes('parks')) {
          return 'parks';
        }

        // Default: Public Works (for trucks, pickups, etc.)
        return 'publicWorks';
      };

      let unitCounter = 1;
      for (const vehicle of vehiclesResult.rows) {
        const dept = assignDepartment(vehicle);
        const deptUnitTypes = unitTypes[dept] || ['unit'];
        const unitType = deptUnitTypes[Math.floor(Math.random() * deptUnitTypes.length)];

        // Generate call sign (e.g., "TPD-101", "TFD-E1", "TPW-T45")
        let callSign: string;
        if (dept === 'police') {
          callSign = `TPD-${100 + unitCounter}`;
        } else if (dept === 'fire') {
          callSign = `TFD-${unitType.charAt(0).toUpperCase()}${unitCounter}`;
        } else if (dept === 'publicWorks') {
          callSign = `TPW-${unitCounter}`;
        } else if (dept === 'transit') {
          callSign = `BUS-${unitCounter}`;
        } else if (dept === 'utilities') {
          callSign = `UTIL-${unitCounter}`;
        } else {
          callSign = `PARKS-${unitCounter}`;
        }

        const radioId = `RADIO-${String(unitCounter).padStart(4, '0')}`;
        const frequency = radioChannels[dept] || '151.115';

        await client.query(`
          INSERT INTO radio_units (
            vehicle_id, radio_id, call_sign, department, unit_type,
            frequency, status, current_location_lat, current_location_lng
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (radio_id) DO UPDATE SET
            vehicle_id = EXCLUDED.vehicle_id,
            call_sign = EXCLUDED.call_sign,
            department = EXCLUDED.department,
            unit_type = EXCLUDED.unit_type,
            frequency = EXCLUDED.frequency
        `, [
          vehicle.id,
          radioId,
          callSign,
          dept,
          unitType,
          frequency,
          'available',
          30.4383 + (Math.random() - 0.5) * 0.1,
          -84.2807 + (Math.random() - 0.5) * 0.1
        ]);

        unitCounter++;
      }

      console.log(`✅ Created ${unitCounter - 1} radio units`);
    } finally {
      client.release();
    }
  }

  /**
   * Load existing radio units from database
   */
  private async loadExistingRadioUnits(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, vehicle_id, radio_id, call_sign, department, unit_type,
               frequency, status, current_location_lat, current_location_lng
        FROM radio_units
        WHERE status != 'out_of_service'
      `);

      for (const row of result.rows) {
        this.radioUnits.set(row.id, {
          id: row.id,
          vehicleId: row.vehicle_id,
          radioId: row.radio_id,
          callSign: row.call_sign,
          department: row.department,
          unitType: row.unit_type,
          frequency: row.frequency,
          status: row.status,
          currentLocationLat: parseFloat(row.current_location_lat),
          currentLocationLng: parseFloat(row.current_location_lng)
        });
      }

      console.log(`📻 Loaded ${this.radioUnits.size} radio units into memory`);
    } finally {
      client.release();
    }
  }

  /**
   * Start radio traffic emulation (routine transmissions)
   */
  private startRadioTrafficEmulation(): void {
    // Generate routine radio traffic every 10-30 seconds
    const generateRoutineTraffic = async () => {
      const units = Array.from(this.radioUnits.values());
      if (units.length === 0) return;

      // Random unit transmits
      const unit = units[Math.floor(Math.random() * units.length)];

      const transmissionTypes = [
        { type: 'status', priority: 'routine', messages: [
          '10-8, in service',
          '10-7, out of service for meal',
          '10-23, arrived at scene',
          '10-24, assignment completed',
          'Performing area patrol',
          'Available for calls',
          'Returning to station'
        ]},
        { type: 'response', priority: 'routine', messages: [
          'Copy that, en route',
          'Received, responding',
          '10-4, acknowledged',
          'Roger, will advise',
          'Copy, will investigate',
          'Understood, standing by'
        ]},
        { type: 'traffic', priority: 'routine', messages: [
          'Traffic stop, vehicle check',
          'Running plate check',
          'Driver information requested',
          'Clear to proceed',
          'License verified, clear'
        ]}
      ];

      const transmission = transmissionTypes[Math.floor(Math.random() * transmissionTypes.length)];
      const message = transmission.messages[Math.floor(Math.random() * transmission.messages.length)];

      await this.recordTransmission(
        unit.id,
        unit.callSign,
        transmission.type,
        transmission.priority,
        message,
        unit.currentLocationLat,
        unit.currentLocationLng
      );
    };

    setInterval(generateRoutineTraffic, 15000 + Math.random() * 15000); // Every 15-30 seconds
    console.log('📻 Radio traffic emulation started');
  }

  /**
   * Start incident emulation (emergency calls)
   */
  private startIncidentEmulation(): void {
    // Generate incidents every 5-15 minutes
    const generateIncident = async () => {
      // Pick a random department weighted toward emergency services
      const deptRoll = Math.random();
      let department: string;
      if (deptRoll < 0.35) department = 'police';
      else if (deptRoll < 0.60) department = 'fire';
      else if (deptRoll < 0.75) department = 'publicWorks';
      else department = 'utilities';

      const incidentTypesList = this.incidentTypes[department as keyof typeof this.incidentTypes] || this.incidentTypes.police;
      const incidentType = incidentTypesList[Math.floor(Math.random() * incidentTypesList.length)];

      // Priority: 1=emergency, 2=urgent, 3=routine
      const priority = Math.random() < 0.15 ? 1 : Math.random() < 0.40 ? 2 : 3;

      const location = this.tallahasseeLocations[Math.floor(Math.random() * this.tallahasseeLocations.length)];

      const incidentNumber = `${department.toUpperCase()}-${new Date().getFullYear()}-${String(this.incidentCounter++).padStart(6, '0')}`;

      await this.createIncident(
        incidentNumber,
        incidentType,
        priority,
        location.address,
        location.lat,
        location.lng,
        department
      );
    };

    setInterval(generateIncident, 300000 + Math.random() * 600000); // Every 5-15 minutes
    // Generate first incident immediately
    setTimeout(generateIncident, 5000);
    console.log('🚨 Incident emulation started');
  }

  /**
   * Create and dispatch an incident
   */
  private async createIncident(
    incidentNumber: string,
    incidentType: string,
    priority: number,
    address: string,
    lat: number,
    lng: number,
    department: string
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Find available units from the appropriate department
      const availableUnits = Array.from(this.radioUnits.values())
        .filter(u => u.department === department && u.status === 'available')
        .slice(0, priority === 1 ? 3 : priority === 2 ? 2 : 1); // More units for higher priority

      if (availableUnits.length === 0) {
        console.log(`⚠️ No available units for ${incidentType} in ${department}`);
        return;
      }

      const unitsAssigned = availableUnits.map(u => u.id);

      // Create incident
      const result = await client.query(`
        INSERT INTO radio_incidents (
          incident_number, incident_type, priority, status,
          location_address, location_lat, location_lng,
          description, units_assigned, dispatch_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `, [
        incidentNumber,
        incidentType,
        priority,
        'dispatched',
        address,
        lat,
        lng,
        `${incidentType} reported at ${address}`,
        unitsAssigned
      ]);

      const incidentId = result.rows[0].id;

      console.log(`🚨 INCIDENT ${incidentNumber}: ${incidentType} at ${address} - Priority ${priority}`);

      // Dispatch units
      for (const unit of availableUnits) {
        await this.dispatchUnit(unit, incidentId, incidentNumber, incidentType, address, lat, lng);
      }

      // Store in active incidents
      this.activeIncidents.set(incidentId, {
        id: incidentId,
        incidentNumber,
        incidentType,
        priority,
        status: 'dispatched',
        locationAddress: address,
        locationLat: lat,
        locationLng: lng,
        description: `${incidentType} at ${address}`,
        unitsAssigned
      });

      // Schedule incident progression
      this.scheduleIncidentProgression(incidentId, availableUnits);

    } finally {
      client.release();
    }
  }

  /**
   * Dispatch a unit to an incident
   */
  private async dispatchUnit(
    unit: RadioUnit,
    incidentId: string,
    incidentNumber: string,
    incidentType: string,
    address: string,
    lat: number,
    lng: number
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Update unit status
      await client.query(`
        UPDATE radio_units
        SET status = 'dispatched', last_transmission_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [unit.id]);

      unit.status = 'dispatched';

      // Record dispatch transmission
      const dispatchMessage = `${unit.callSign}, respond to ${incidentType} at ${address}`;
      await this.recordTransmission(
        unit.id,
        'DISPATCH',
        'dispatch',
        'emergency',
        dispatchMessage,
        lat,
        lng,
        { incident_id: incidentId }
      );

      // Record unit acknowledgment
      await this.recordTransmission(
        unit.id,
        unit.callSign,
        'response',
        'priority',
        `${unit.callSign} copy, en route to ${address}`,
        unit.currentLocationLat,
        unit.currentLocationLng,
        { incident_id: incidentId }
      );

      // Log dispatch action
      await client.query(`
        INSERT INTO dispatch_log (
          action_type, dispatcher_name, radio_unit_id, incident_id, message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'assign',
        'Dispatch Center',
        unit.id,
        incidentId,
        `Dispatched ${unit.callSign} to ${incidentNumber}: ${incidentType}`
      ]);

      console.log(`  📡 Dispatched ${unit.callSign} to ${incidentNumber}`);

    } finally {
      client.release();
    }
  }

  /**
   * Schedule incident progression (en route -> on scene -> cleared)
   */
  private scheduleIncidentProgression(incidentId: string, units: RadioUnit[]): void {
    // En route (1-3 minutes)
    setTimeout(async () => {
      for (const unit of units) {
        await this.updateUnitStatus(unit, 'en_route', incidentId);
      }
    }, 60000 + Math.random() * 120000);

    // On scene (3-8 minutes)
    setTimeout(async () => {
      for (const unit of units) {
        await this.updateUnitStatus(unit, 'on_scene', incidentId);
      }
    }, 180000 + Math.random() * 300000);

    // Clear incident (10-30 minutes)
    setTimeout(async () => {
      await this.clearIncident(incidentId, units);
    }, 600000 + Math.random() * 1200000);
  }

  /**
   * Update unit status during incident
   */
  private async updateUnitStatus(unit: RadioUnit, status: string, incidentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) return;

      await client.query(`
        UPDATE radio_units
        SET status = $1, last_transmission_at = NOW(), updated_at = NOW()
        WHERE id = $2
      `, [status, unit.id]);

      unit.status = status as any;

      const messages: Record<string, string> = {
        'en_route': `${unit.callSign} en route`,
        'on_scene': `${unit.callSign} on scene at ${incident.locationAddress}`
      };

      await this.recordTransmission(
        unit.id,
        unit.callSign,
        'status',
        incident.priority === 1 ? 'emergency' : 'priority',
        messages[status] || `${unit.callSign} status update`,
        incident.locationLat,
        incident.locationLng,
        { incident_id: incidentId }
      );

      console.log(`  📍 ${unit.callSign} ${status} for ${incident.incidentNumber}`);

    } finally {
      client.release();
    }
  }

  /**
   * Clear incident and return units to service
   */
  private async clearIncident(incidentId: string, units: RadioUnit[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      const incident = this.activeIncidents.get(incidentId);
      if (!incident) return;

      // Update incident status
      await client.query(`
        UPDATE radio_incidents
        SET status = 'cleared', cleared_time = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [incidentId]);

      // Return units to service
      for (const unit of units) {
        await client.query(`
          UPDATE radio_units
          SET status = 'available', last_transmission_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [unit.id]);

        unit.status = 'available';

        await this.recordTransmission(
          unit.id,
          unit.callSign,
          'status',
          'routine',
          `${unit.callSign} clear, back in service`,
          unit.currentLocationLat,
          unit.currentLocationLng,
          { incident_id: incidentId }
        );
      }

      console.log(`  ✅ Cleared ${incident.incidentNumber}, ${units.length} units back in service`);

      this.activeIncidents.delete(incidentId);

    } finally {
      client.release();
    }
  }

  /**
   * Record a radio transmission
   */
  private async recordTransmission(
    radioUnitId: string,
    callSign: string,
    transmissionType: string,
    priority: string,
    message: string,
    lat: number,
    lng: number,
    metadata?: any
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO radio_transmissions (
          radio_unit_id, call_sign, transmission_type, priority,
          message, latitude, longitude, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        radioUnitId === 'DISPATCH' ? null : radioUnitId,
        callSign,
        transmissionType,
        priority,
        message,
        lat,
        lng,
        metadata ? JSON.stringify(metadata) : null
      ]);
    } finally {
      client.release();
    }
  }

  /**
   * Start task emulation
   */
  private startTaskEmulation(): void {
    // Generate tasks every 10-20 minutes
    const generateTask = async () => {
      const taskTypeKeys = Object.keys(this.taskTypes) as Array<keyof typeof this.taskTypes>;
      const taskCategory = taskTypeKeys[Math.floor(Math.random() * taskTypeKeys.length)];
      const taskTypesList = this.taskTypes[taskCategory];
      const taskType = taskTypesList[Math.floor(Math.random() * taskTypesList.length)];

      await this.createTask(taskCategory, taskType);
    };

    setInterval(generateTask, 600000 + Math.random() * 600000); // Every 10-20 minutes
    // Generate first task immediately
    setTimeout(generateTask, 10000);
    console.log('📋 Task emulation started');
  }

  /**
   * Create a new task
   */
  private async createTask(taskCategory: string, taskType: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Find an available vehicle and driver
      const vehicleResult = await client.query(`
        SELECT v.id as vehicle_id, d.id as driver_id, ru.id as radio_unit_id
        FROM vehicles v
        LEFT JOIN drivers d ON d.id = (
          SELECT id FROM drivers
          WHERE status = 'active'
          ORDER BY RANDOM() LIMIT 1
        )
        LEFT JOIN radio_units ru ON ru.vehicle_id = v.id
        WHERE v.status = 'active'
        ORDER BY RANDOM()
        LIMIT 1
      `);

      if (vehicleResult.rows.length === 0) return;

      const { vehicle_id, driver_id, radio_unit_id } = vehicleResult.rows[0];
      const location = this.tallahasseeLocations[Math.floor(Math.random() * this.tallahasseeLocations.length)];

      const taskNumber = `TASK-${new Date().getFullYear()}-${String(this.taskCounter++).padStart(6, '0')}`;
      const priority = Math.random() < 0.10 ? 'emergency' : Math.random() < 0.30 ? 'high' : 'normal';

      const scheduledStart = new Date(Date.now() + (Math.random() * 3600000)); // Within next hour
      const estimatedDuration = 30 + Math.floor(Math.random() * 120); // 30-150 minutes

      const result = await client.query(`
        INSERT INTO tasks (
          task_number, task_type, priority, status, title, description,
          assigned_to_driver_id, assigned_to_vehicle_id, assigned_to_radio_unit_id,
          assigned_by, assigned_at, location_address, location_lat, location_lng,
          scheduled_start, estimated_duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        taskNumber,
        taskType,
        priority,
        'assigned',
        taskType,
        `${taskType} scheduled at ${location.address}`,
        driver_id,
        vehicle_id,
        radio_unit_id,
        'Dispatch Center',
        location.address,
        location.lat,
        location.lng,
        scheduledStart,
        estimatedDuration
      ]);

      const taskId = result.rows[0].id;

      console.log(`📋 TASK ${taskNumber}: ${taskType} assigned - Priority ${priority}`);

      // Record dispatch log
      await client.query(`
        INSERT INTO dispatch_log (
          action_type, dispatcher_name, radio_unit_id, task_id, message
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'assign',
        'Dispatch Center',
        radio_unit_id,
        taskId,
        `Assigned ${taskNumber}: ${taskType} at ${location.address}`
      ]);

      // Schedule task progression
      this.scheduleTaskProgression(taskId, radio_unit_id, taskNumber, estimatedDuration);

    } finally {
      client.release();
    }
  }

  /**
   * Schedule task progression
   */
  private scheduleTaskProgression(taskId: string, radioUnitId: string, taskNumber: string, estimatedDuration: number): void {
    // Start task
    setTimeout(async () => {
      await this.updateTaskStatus(taskId, 'in_progress', radioUnitId, taskNumber);
    }, Math.random() * 1800000); // 0-30 minutes

    // Complete task
    setTimeout(async () => {
      await this.updateTaskStatus(taskId, 'completed', radioUnitId, taskNumber);
    }, estimatedDuration * 60000 + Math.random() * 1800000);
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(taskId: string, status: string, radioUnitId: string, taskNumber: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE tasks
        SET status = $1,
            actual_start = CASE WHEN $1 = 'in_progress' THEN NOW() ELSE actual_start END,
            actual_end = CASE WHEN $1 = 'completed' THEN NOW() ELSE actual_end END,
            updated_at = NOW()
        WHERE id = $2
      `, [status, taskId]);

      console.log(`  ✅ Task ${taskNumber} ${status}`);

      // Record task update
      await client.query(`
        INSERT INTO task_updates (
          task_id, update_type, message, created_by
        ) VALUES ($1, $2, $3, $4)
      `, [
        taskId,
        'status',
        `Task ${status}`,
        'System'
      ]);

    } finally {
      client.release();
    }
  }

  /**
   * Start dispatch log emulation
   */
  private startDispatchLogEmulation(): void {
    console.log('📝 Dispatch log emulation started');
  }

  async shutdown(): Promise<void> {
    await this.pool.end();
    console.log('🛑 Radio Traffic Emulator shutdown');
  }
}

// Start the emulator immediately (ES module version)
const emulator = new RadioTrafficEmulator();
emulator.initialize().catch(console.error);

process.on('SIGINT', async () => {
  await emulator.shutdown();
  process.exit(0);
});
