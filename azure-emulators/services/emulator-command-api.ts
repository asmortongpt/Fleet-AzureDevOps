/**
 * Emulator Command API
 * Chat interface to trigger specific scenarios in the radio traffic emulator
 */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

interface CommandRequest {
  command: string;
  parameters?: Record<string, any>;
}

interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class EmulatorCommandAPI {
  private app: express.Application;
  private pool: Pool;
  private port: number;

  // Tallahassee locations
  private locations = [
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

  constructor(port: number = 3005) {
    this.port = port;
    this.app = express();
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

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'Emulator Command API' });
    });

    // Chat command endpoint
    this.app.post('/command', async (req, res) => {
      try {
        const { command, parameters } = req.body as CommandRequest;
        const response = await this.processCommand(command, parameters);
        res.json(response);
      } catch (error: any) {
        res.status(500).json({
          success: false,
          message: `Error: ${error.message}`
        });
      }
    });

    // Get available commands
    this.app.get('/commands', (req, res) => {
      res.json({
        commands: [
          {
            name: 'create incident',
            description: 'Create an emergency incident',
            examples: [
              'create a structure fire at 100 N Monroe St',
              'trigger a vehicle accident on Tennessee St',
              'simulate a medical emergency downtown'
            ],
            parameters: {
              type: 'Incident type (fire, accident, medical, etc.)',
              location: 'Address or area',
              priority: 'emergency, urgent, or routine (optional)'
            }
          },
          {
            name: 'dispatch unit',
            description: 'Dispatch a specific unit to a location',
            examples: [
              'dispatch TPD-101 to 1940 N Monroe St',
              'send fire truck to Capital Circle',
              'dispatch ambulance to Market St'
            ],
            parameters: {
              unit: 'Call sign or unit type',
              location: 'Address or area'
            }
          },
          {
            name: 'create task',
            description: 'Create a task assignment',
            examples: [
              'assign a pothole repair on Tennessee St',
              'create a waste collection route',
              'schedule equipment inspection'
            ],
            parameters: {
              type: 'Task type',
              location: 'Address or area',
              priority: 'emergency, high, normal, low (optional)'
            }
          },
          {
            name: 'send radio',
            description: 'Send a radio transmission',
            examples: [
              'TPD-101 report 10-8 in service',
              'send status update from TFD-E1',
              'broadcast all units stand by'
            ],
            parameters: {
              unit: 'Call sign',
              message: 'Radio message'
            }
          },
          {
            name: 'mass casualty',
            description: 'Trigger a mass casualty incident',
            examples: [
              'mass casualty incident at FSU stadium',
              'trigger MCI downtown',
              'simulate major accident on I-10'
            ]
          },
          {
            name: 'status',
            description: 'Get current system status',
            examples: [
              'show status',
              'what units are available',
              'list active incidents'
            ]
          }
        ]
      });
    });

    // Get recent activity
    this.app.get('/activity', async (req, res) => {
      try {
        const client = await this.pool.connect();
        try {
          const limit = parseInt(req.query.limit as string) || 20;

          // Get recent transmissions
          const transmissions = await client.query(`
            SELECT call_sign, transmission_type, priority, message, transmitted_at
            FROM radio_transmissions
            ORDER BY transmitted_at DESC
            LIMIT $1
          `, [limit]);

          // Get active incidents
          const incidents = await client.query(`
            SELECT incident_number, incident_type, priority, status, location_address, dispatch_time
            FROM radio_incidents
            WHERE status != 'cleared'
            ORDER BY dispatch_time DESC
          `);

          // Get active tasks
          const tasks = await client.query(`
            SELECT task_number, task_type, priority, status, title, scheduled_start
            FROM tasks
            WHERE status IN ('assigned', 'in_progress')
            ORDER BY scheduled_start DESC
          `);

          res.json({
            transmissions: transmissions.rows,
            active_incidents: incidents.rows,
            active_tasks: tasks.rows
          });
        } finally {
          client.release();
        }
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Process natural language commands
   */
  private async processCommand(command: string, parameters?: Record<string, any>): Promise<CommandResponse> {
    const cmd = command.toLowerCase().trim();

    // Create incident commands
    if (cmd.includes('create') && (cmd.includes('incident') || cmd.includes('fire') ||
        cmd.includes('accident') || cmd.includes('medical') || cmd.includes('emergency'))) {
      return await this.createIncident(cmd, parameters);
    }

    // Dispatch unit commands
    if (cmd.includes('dispatch') || cmd.includes('send') && (cmd.includes('unit') || cmd.includes('tpd') ||
        cmd.includes('tfd') || cmd.includes('ambulance'))) {
      return await this.dispatchUnit(cmd, parameters);
    }

    // Create task commands
    if ((cmd.includes('create') || cmd.includes('assign') || cmd.includes('schedule')) &&
        (cmd.includes('task') || cmd.includes('repair') || cmd.includes('route') || cmd.includes('inspection'))) {
      return await this.createTask(cmd, parameters);
    }

    // Radio transmission commands
    if (cmd.includes('radio') || cmd.includes('report') || cmd.includes('broadcast') ||
        cmd.includes('10-') || cmd.match(/^[a-z]+-\d+/i)) {
      return await this.sendRadioTransmission(cmd, parameters);
    }

    // Mass casualty incident
    if (cmd.includes('mass casualty') || cmd.includes('mci') || cmd.includes('major')) {
      return await this.createMassCasualtyIncident(cmd, parameters);
    }

    // Status commands
    if (cmd.includes('status') || cmd.includes('show') || cmd.includes('list') || cmd.includes('what')) {
      return await this.getStatus(cmd);
    }

    return {
      success: false,
      message: 'Command not recognized. Try "show status", "create incident", or see /commands for available commands.'
    };
  }

  /**
   * Create an incident from command
   */
  private async createIncident(command: string, params?: Record<string, any>): Promise<CommandResponse> {
    const client = await this.pool.connect();
    try {
      // Parse incident type
      let incidentType = params?.type || this.parseIncidentType(command);
      let location = params?.location ?
        this.findLocation(params.location) :
        this.findLocation(command) || this.locations[Math.floor(Math.random() * this.locations.length)];

      let priority = params?.priority || this.parsePriority(command);

      // Determine department
      let department = this.getDepartmentForIncident(incidentType);

      // Generate incident number
      const incidentNumber = `${department.toUpperCase()}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

      // Find available units
      const unitsResult = await client.query(`
        SELECT id, call_sign, unit_type
        FROM radio_units
        WHERE department = $1 AND status = 'available'
        LIMIT $2
      `, [department, priority === 1 ? 3 : priority === 2 ? 2 : 1]);

      if (unitsResult.rows.length === 0) {
        return {
          success: false,
          message: `No available ${department} units to dispatch`
        };
      }

      const unitIds = unitsResult.rows.map(u => u.id);
      const unitCallSigns = unitsResult.rows.map(u => u.call_sign);

      // Create incident
      const result = await client.query(`
        INSERT INTO radio_incidents (
          incident_number, incident_type, priority, status,
          location_address, location_lat, location_lng,
          description, units_assigned, dispatch_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, incident_number
      `, [
        incidentNumber,
        incidentType,
        priority,
        'dispatched',
        location.address,
        location.lat,
        location.lng,
        `${incidentType} at ${location.address}`,
        unitIds
      ]);

      // Update unit statuses
      await client.query(`
        UPDATE radio_units
        SET status = 'dispatched', last_transmission_at = NOW(), updated_at = NOW()
        WHERE id = ANY($1)
      `, [unitIds]);

      // Create dispatch transmissions
      for (const unit of unitsResult.rows) {
        await client.query(`
          INSERT INTO radio_transmissions (
            radio_unit_id, call_sign, transmission_type, priority, message, latitude, longitude
          ) VALUES ($1, $2, 'dispatch', $3, $4, $5, $6)
        `, [
          unit.id,
          'DISPATCH',
          priority === 1 ? 'emergency' : priority === 2 ? 'priority' : 'routine',
          `${unit.call_sign}, respond to ${incidentType} at ${location.address}`,
          location.lat,
          location.lng
        ]);

        // Unit acknowledgment
        await client.query(`
          INSERT INTO radio_transmissions (
            radio_unit_id, call_sign, transmission_type, priority, message, latitude, longitude
          ) VALUES ($1, $2, 'response', 'priority', $3, $4, $5)
        `, [
          unit.id,
          unit.call_sign,
          `${unit.call_sign} copy, en route`,
          location.lat,
          location.lng
        ]);
      }

      return {
        success: true,
        message: `Created ${incidentType} at ${location.address}. Dispatched units: ${unitCallSigns.join(', ')}`,
        data: {
          incident_number: result.rows[0].incident_number,
          type: incidentType,
          location: location.address,
          priority: priority === 1 ? 'EMERGENCY' : priority === 2 ? 'URGENT' : 'ROUTINE',
          units: unitCallSigns
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Dispatch a specific unit
   */
  private async dispatchUnit(command: string, params?: Record<string, any>): Promise<CommandResponse> {
    const client = await this.pool.connect();
    try {
      // Parse call sign
      const callSign = params?.unit || this.parseCallSign(command);
      const location = params?.location ?
        this.findLocation(params.location) :
        this.findLocation(command) || this.locations[0];

      if (!callSign) {
        return {
          success: false,
          message: 'Could not identify unit. Please specify a call sign (e.g., TPD-101, TFD-E1)'
        };
      }

      // Find unit
      const unitResult = await client.query(`
        SELECT id, call_sign, status, department
        FROM radio_units
        WHERE call_sign = $1
      `, [callSign]);

      if (unitResult.rows.length === 0) {
        return {
          success: false,
          message: `Unit ${callSign} not found`
        };
      }

      const unit = unitResult.rows[0];

      // Update unit status
      await client.query(`
        UPDATE radio_units
        SET status = 'dispatched', last_transmission_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [unit.id]);

      // Create radio transmission
      await client.query(`
        INSERT INTO radio_transmissions (
          radio_unit_id, call_sign, transmission_type, priority, message, latitude, longitude
        ) VALUES ($1, $2, 'dispatch', 'priority', $3, $4, $5)
      `, [
        unit.id,
        'DISPATCH',
        `${callSign}, respond to ${location.address}`,
        location.lat,
        location.lng
      ]);

      return {
        success: true,
        message: `Dispatched ${callSign} to ${location.address}`,
        data: {
          call_sign: callSign,
          location: location.address,
          previous_status: unit.status
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create a task
   */
  private async createTask(command: string, params?: Record<string, any>): Promise<CommandResponse> {
    const client = await this.pool.connect();
    try {
      const taskType = params?.type || this.parseTaskType(command);
      const location = params?.location ?
        this.findLocation(params.location) :
        this.findLocation(command) || this.locations[Math.floor(Math.random() * this.locations.length)];
      const priority = params?.priority || (command.includes('urgent') || command.includes('emergency') ? 'high' : 'normal');

      // Find available vehicle and driver
      const vehicleResult = await client.query(`
        SELECT v.id as vehicle_id, d.id as driver_id, ru.id as radio_unit_id
        FROM vehicles v
        LEFT JOIN drivers d ON d.id = (
          SELECT id FROM drivers WHERE status = 'active' ORDER BY RANDOM() LIMIT 1
        )
        LEFT JOIN radio_units ru ON ru.vehicle_id = v.id
        WHERE v.status = 'active'
        ORDER BY RANDOM()
        LIMIT 1
      `);

      if (vehicleResult.rows.length === 0) {
        return {
          success: false,
          message: 'No available vehicles for task assignment'
        };
      }

      const { vehicle_id, driver_id, radio_unit_id } = vehicleResult.rows[0];
      const taskNumber = `TASK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      const result = await client.query(`
        INSERT INTO tasks (
          task_number, task_type, priority, status, title, description,
          assigned_to_driver_id, assigned_to_vehicle_id, assigned_to_radio_unit_id,
          assigned_by, assigned_at, location_address, location_lat, location_lng,
          scheduled_start, estimated_duration_minutes
        ) VALUES ($1, $2, $3, 'assigned', $4, $5, $6, $7, $8, 'Command API', NOW(), $9, $10, $11, NOW(), 60)
        RETURNING id, task_number
      `, [
        taskNumber,
        taskType,
        priority,
        taskType,
        `${taskType} at ${location.address}`,
        driver_id,
        vehicle_id,
        radio_unit_id,
        location.address,
        location.lat,
        location.lng
      ]);

      return {
        success: true,
        message: `Created task: ${taskType} at ${location.address}`,
        data: {
          task_number: taskNumber,
          type: taskType,
          location: location.address,
          priority
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Send radio transmission
   */
  private async sendRadioTransmission(command: string, params?: Record<string, any>): Promise<CommandResponse> {
    const client = await this.pool.connect();
    try {
      const callSign = params?.unit || this.parseCallSign(command);
      const message = params?.message || command.replace(callSign || '', '').trim();

      if (!callSign) {
        return {
          success: false,
          message: 'Could not identify unit call sign'
        };
      }

      // Find unit
      const unitResult = await client.query(`
        SELECT id, current_location_lat, current_location_lng
        FROM radio_units
        WHERE call_sign = $1
      `, [callSign]);

      if (unitResult.rows.length === 0) {
        return {
          success: false,
          message: `Unit ${callSign} not found`
        };
      }

      const unit = unitResult.rows[0];

      await client.query(`
        INSERT INTO radio_transmissions (
          radio_unit_id, call_sign, transmission_type, priority, message, latitude, longitude
        ) VALUES ($1, $2, 'status', 'routine', $3, $4, $5)
      `, [
        unit.id,
        callSign,
        message,
        unit.current_location_lat,
        unit.current_location_lng
      ]);

      return {
        success: true,
        message: `Radio transmission sent from ${callSign}`,
        data: {
          call_sign: callSign,
          message
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create mass casualty incident
   */
  private async createMassCasualtyIncident(command: string, params?: Record<string, any>): Promise<CommandResponse> {
    const location = params?.location ?
      this.findLocation(params.location) :
      this.findLocation(command) || this.locations[0];

    // Create multiple incidents
    const incidents = [
      await this.createIncident(`create structure fire at ${location.address}`, { priority: 1 }),
      await this.createIncident(`create medical emergency at ${location.address}`, { priority: 1 }),
      await this.createIncident(`create vehicle accident at ${location.address}`, { priority: 1 })
    ];

    return {
      success: true,
      message: `Mass Casualty Incident created at ${location.address}. All emergency units dispatched.`,
      data: {
        location: location.address,
        incidents: incidents.map(i => i.data)
      }
    };
  }

  /**
   * Get system status
   */
  private async getStatus(command: string): Promise<CommandResponse> {
    const client = await this.pool.connect();
    try {
      const stats = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM radio_units WHERE status = 'available') as available_units,
          (SELECT COUNT(*) FROM radio_units WHERE status = 'dispatched') as dispatched_units,
          (SELECT COUNT(*) FROM radio_incidents WHERE status != 'cleared') as active_incidents,
          (SELECT COUNT(*) FROM tasks WHERE status IN ('assigned', 'in_progress')) as active_tasks,
          (SELECT COUNT(*) FROM radio_transmissions WHERE transmitted_at > NOW() - INTERVAL '1 hour') as recent_transmissions
      `);

      return {
        success: true,
        message: 'Current system status',
        data: stats.rows[0]
      };
    } finally {
      client.release();
    }
  }

  // Helper parsing functions
  private parseIncidentType(command: string): string {
    const types: Record<string, string> = {
      'fire': 'Structure Fire',
      'vehicle fire': 'Vehicle Fire',
      'accident': 'Vehicle Accident',
      'medical': 'Medical Emergency',
      'cardiac': 'Cardiac Arrest',
      'robbery': 'Robbery',
      'burglary': 'Burglary',
      'assault': 'Assault',
      'theft': 'Theft Report',
      'water': 'Water Main Break',
      'pothole': 'Pothole Repair',
      'power': 'Power Outage'
    };

    for (const [key, value] of Object.entries(types)) {
      if (command.includes(key)) return value;
    }

    return 'General Incident';
  }

  private parseCallSign(command: string): string | null {
    const match = command.match(/\b([A-Z]{2,4}-[A-Z]?\d+)\b/i);
    return match ? match[1].toUpperCase() : null;
  }

  private parseTaskType(command: string): string {
    if (command.includes('pothole') || command.includes('repair')) return 'Pothole Repair';
    if (command.includes('route') || command.includes('collection')) return 'Waste Collection Route';
    if (command.includes('inspection')) return 'Equipment Inspection';
    if (command.includes('maintenance')) return 'Scheduled Maintenance';
    if (command.includes('delivery')) return 'Material Delivery';
    return 'General Task';
  }

  private parsePriority(command: string): number {
    if (command.includes('emergency') || command.includes('critical')) return 1;
    if (command.includes('urgent') || command.includes('high')) return 2;
    return 3;
  }

  private findLocation(text: string): any {
    const lower = text.toLowerCase();
    for (const loc of this.locations) {
      if (lower.includes(loc.address.toLowerCase()) ||
          loc.address.toLowerCase().includes(lower.split(' ').slice(0, 3).join(' '))) {
        return loc;
      }
    }
    // Check for street names
    if (lower.includes('monroe')) return this.locations[0];
    if (lower.includes('tennessee')) return this.locations[5];
    if (lower.includes('capital')) return this.locations[4];
    if (lower.includes('downtown')) return this.locations[0];

    return null;
  }

  private getDepartmentForIncident(type: string): string {
    const lower = type.toLowerCase();
    if (lower.includes('fire') || lower.includes('smoke') || lower.includes('hazmat')) return 'fire';
    if (lower.includes('medical') || lower.includes('cardiac') || lower.includes('ambulance')) return 'fire'; // EMS under fire dept
    if (lower.includes('robbery') || lower.includes('assault') || lower.includes('theft') || lower.includes('burglary')) return 'police';
    if (lower.includes('water') || lower.includes('pothole') || lower.includes('road')) return 'publicWorks';
    if (lower.includes('power') || lower.includes('electric')) return 'utilities';
    return 'police'; // default
  }

  start(): void {
    this.app.listen(this.port, () => {
      console.log(`🎮 Emulator Command API listening on port ${this.port}`);
      console.log(`📡 Chat interface ready at http://localhost:${this.port}`);
      console.log(`📋 Available commands at http://localhost:${this.port}/commands`);
    });
  }
}

// Start the API if run directly
const api = new EmulatorCommandAPI(3005);
api.start();
