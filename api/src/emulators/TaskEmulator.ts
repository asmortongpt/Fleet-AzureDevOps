/**
 * Task Management Emulator
 * Generates realistic fleet management tasks dynamically
 * Fortune 50 Security Standards - Parameterized queries only
 *
 * Task Types: maintenance, compliance, inspection, procurement, safety
 * Statuses: TODO, IN_PROGRESS, COMPLETED, BLOCKED
 * Priorities: low, medium, high, urgent
 */

import { faker } from '@faker-js/faker'
import { Pool } from 'pg'

export interface EmulatedTask {
  id: number
  taskId: string
  title: string
  description: string
  taskType: 'maintenance' | 'compliance' | 'inspection' | 'procurement' | 'safety'
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedToDriver?: number
  assignedDriverName?: string
  assignedToVehicle?: number
  vehicleNumber?: string
  dependencies: number[]
  dependencyTaskIds?: string[]
  dueDate: Date
  startDate?: Date
  completedDate?: Date
  estimatedHours: number
  actualHours?: number
  completionPercentage: number
  blockedReason?: string
  tags: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  metadata: {
    location?: string
    vendor?: string
    cost?: number
    parts?: string[]
    notes?: string
  }
}

// Task templates for each type
const MAINTENANCE_TASKS = [
  { title: 'Oil Change and Filter Replacement', estimatedHours: 1, tags: ['routine', 'preventive'] },
  { title: 'Tire Rotation and Pressure Check', estimatedHours: 0.75, tags: ['routine', 'safety'] },
  { title: 'Brake Pad Inspection and Replacement', estimatedHours: 3, tags: ['safety', 'critical'] },
  { title: 'Transmission Fluid Service', estimatedHours: 2, tags: ['preventive', 'scheduled'] },
  { title: 'Air Filter Replacement', estimatedHours: 0.5, tags: ['routine', 'quick'] },
  { title: 'Battery Terminal Cleaning and Testing', estimatedHours: 0.5, tags: ['electrical', 'preventive'] },
  { title: 'Coolant System Flush', estimatedHours: 1.5, tags: ['preventive', 'seasonal'] },
  { title: 'Serpentine Belt Inspection', estimatedHours: 1, tags: ['preventive', 'inspection'] },
  { title: 'Spark Plug Replacement', estimatedHours: 2, tags: ['engine', 'performance'] },
  { title: 'Wheel Alignment Check', estimatedHours: 1, tags: ['handling', 'safety'] },
  { title: 'Exhaust System Inspection', estimatedHours: 1, tags: ['emissions', 'inspection'] },
  { title: 'Windshield Wiper Blade Replacement', estimatedHours: 0.25, tags: ['safety', 'quick'] },
  { title: 'Cabin Air Filter Replacement', estimatedHours: 0.5, tags: ['comfort', 'routine'] },
  { title: 'Differential Fluid Service', estimatedHours: 1.5, tags: ['drivetrain', 'preventive'] },
  { title: 'Steering System Inspection', estimatedHours: 1.5, tags: ['safety', 'inspection'] },
  { title: 'Suspension Component Check', estimatedHours: 2, tags: ['safety', 'ride-quality'] },
  { title: 'Radiator Hose Inspection', estimatedHours: 1, tags: ['cooling', 'preventive'] },
  { title: 'Fuel System Cleaning', estimatedHours: 1.5, tags: ['performance', 'preventive'] },
  { title: 'Engine Diagnostic Scan', estimatedHours: 1, tags: ['diagnostics', 'troubleshooting'] },
  { title: 'AC System Performance Check', estimatedHours: 1.5, tags: ['comfort', 'seasonal'] },
]

const COMPLIANCE_TASKS = [
  { title: 'Annual DOT Vehicle Inspection', estimatedHours: 2, tags: ['regulatory', 'annual'] },
  { title: 'Emissions Testing Certification', estimatedHours: 1, tags: ['environmental', 'regulatory'] },
  { title: 'Driver License Verification', estimatedHours: 0.5, tags: ['driver', 'regulatory'] },
  { title: 'Insurance Certificate Update', estimatedHours: 1, tags: ['administrative', 'legal'] },
  { title: 'Vehicle Registration Renewal', estimatedHours: 0.75, tags: ['administrative', 'legal'] },
  { title: 'Safety Equipment Audit', estimatedHours: 1.5, tags: ['safety', 'audit'] },
  { title: 'Fire Extinguisher Inspection', estimatedHours: 0.5, tags: ['safety', 'regulatory'] },
  { title: 'First Aid Kit Inventory Check', estimatedHours: 0.25, tags: ['safety', 'medical'] },
  { title: 'Driver Medical Certification Review', estimatedHours: 0.5, tags: ['driver', 'medical'] },
  { title: 'Hours of Service Log Audit', estimatedHours: 2, tags: ['driver', 'regulatory'] },
  { title: 'Hazmat Certification Verification', estimatedHours: 1, tags: ['hazmat', 'regulatory'] },
  { title: 'Weight Station Compliance Check', estimatedHours: 1, tags: ['regulatory', 'operations'] },
  { title: 'Drug and Alcohol Testing Documentation', estimatedHours: 1.5, tags: ['safety', 'regulatory'] },
  { title: 'ELD System Compliance Verification', estimatedHours: 1, tags: ['technology', 'regulatory'] },
  { title: 'Cargo Securement Training Completion', estimatedHours: 2, tags: ['training', 'safety'] },
]

const INSPECTION_TASKS = [
  { title: 'Pre-Trip Safety Inspection', estimatedHours: 0.5, tags: ['safety', 'daily'] },
  { title: 'Post-Trip Vehicle Condition Report', estimatedHours: 0.5, tags: ['condition', 'daily'] },
  { title: 'Monthly Fleet Safety Audit', estimatedHours: 4, tags: ['safety', 'comprehensive'] },
  { title: 'Quarterly Tire Tread Depth Check', estimatedHours: 2, tags: ['safety', 'quarterly'] },
  { title: 'Bi-Annual Brake System Inspection', estimatedHours: 3, tags: ['safety', 'critical'] },
  { title: 'Annual Comprehensive Vehicle Inspection', estimatedHours: 5, tags: ['comprehensive', 'annual'] },
  { title: 'Body and Paint Condition Assessment', estimatedHours: 1, tags: ['cosmetic', 'assessment'] },
  { title: 'Interior Cleanliness and Damage Inspection', estimatedHours: 0.75, tags: ['interior', 'condition'] },
  { title: 'Lighting System Functionality Check', estimatedHours: 0.5, tags: ['safety', 'electrical'] },
  { title: 'Fluid Leak Inspection', estimatedHours: 1, tags: ['preventive', 'diagnostics'] },
  { title: 'Dashboard Warning Light Diagnostics', estimatedHours: 1.5, tags: ['diagnostics', 'electronics'] },
  { title: 'Cargo Area Damage Assessment', estimatedHours: 1, tags: ['cargo', 'condition'] },
  { title: 'Seat Belt and Airbag System Check', estimatedHours: 1, tags: ['safety', 'passive-safety'] },
  { title: 'Mirror and Glass Condition Inspection', estimatedHours: 0.5, tags: ['safety', 'visibility'] },
  { title: 'Odometer and Gauge Accuracy Verification', estimatedHours: 0.5, tags: ['instrumentation', 'accuracy'] },
]

const PROCUREMENT_TASKS = [
  { title: 'Order Replacement Tires for Fleet', estimatedHours: 1, tags: ['purchasing', 'parts'] },
  { title: 'Request Quote for Brake Pad Bulk Order', estimatedHours: 0.75, tags: ['purchasing', 'quote'] },
  { title: 'Purchase Engine Oil in Bulk', estimatedHours: 0.5, tags: ['purchasing', 'fluids'] },
  { title: 'Source Parts for Scheduled Maintenance', estimatedHours: 1.5, tags: ['purchasing', 'maintenance'] },
  { title: 'Vendor Selection for Major Repair Work', estimatedHours: 2, tags: ['vendor', 'evaluation'] },
  { title: 'Negotiate Maintenance Contract Terms', estimatedHours: 3, tags: ['contract', 'vendor'] },
  { title: 'Order Replacement Batteries', estimatedHours: 0.5, tags: ['purchasing', 'electrical'] },
  { title: 'Purchase Safety Equipment and Supplies', estimatedHours: 1, tags: ['safety', 'purchasing'] },
  { title: 'Acquire Diagnostic Software License', estimatedHours: 1.5, tags: ['technology', 'software'] },
  { title: 'Order Custom Floor Mats and Seat Covers', estimatedHours: 0.75, tags: ['interior', 'accessories'] },
  { title: 'Source Fuel Cards and Payment Systems', estimatedHours: 1, tags: ['fuel', 'administrative'] },
  { title: 'Purchase GPS Tracking Device Upgrades', estimatedHours: 1.5, tags: ['telematics', 'technology'] },
  { title: 'Order Replacement Windshields', estimatedHours: 1, tags: ['glass', 'safety'] },
  { title: 'Acquire Shop Tools and Equipment', estimatedHours: 2, tags: ['tools', 'maintenance'] },
]

const SAFETY_TASKS = [
  { title: 'Conduct Driver Safety Training Session', estimatedHours: 3, tags: ['training', 'education'] },
  { title: 'Review and Update Safety Policies', estimatedHours: 4, tags: ['policy', 'documentation'] },
  { title: 'Investigate Vehicle Accident Report', estimatedHours: 5, tags: ['incident', 'investigation'] },
  { title: 'Implement Dash Camera System', estimatedHours: 2, tags: ['technology', 'prevention'] },
  { title: 'Schedule Defensive Driving Course', estimatedHours: 1, tags: ['training', 'prevention'] },
  { title: 'Analyze Driver Behavior Analytics', estimatedHours: 2, tags: ['analytics', 'monitoring'] },
  { title: 'Create Emergency Response Protocol', estimatedHours: 4, tags: ['planning', 'emergency'] },
  { title: 'Perform Safety Equipment Installation', estimatedHours: 2, tags: ['equipment', 'installation'] },
  { title: 'Conduct Hazard Identification Workshop', estimatedHours: 3, tags: ['training', 'awareness'] },
  { title: 'Review Insurance Claims and Trends', estimatedHours: 2, tags: ['insurance', 'analysis'] },
  { title: 'Install Collision Avoidance System', estimatedHours: 3, tags: ['technology', 'prevention'] },
  { title: 'Audit Vehicle Safety Records', estimatedHours: 3, tags: ['audit', 'compliance'] },
  { title: 'Develop Weather Emergency Procedures', estimatedHours: 3, tags: ['emergency', 'planning'] },
  { title: 'Coordinate Driver Wellness Program', estimatedHours: 2, tags: ['wellness', 'prevention'] },
]

const VENDORS = [
  'AutoZone Commercial',
  'O\'Reilly Auto Parts Fleet',
  'NAPA Auto Care',
  'Firestone Fleet Services',
  'Penske Truck Leasing',
  'Ryder System Inc',
  'Rush Truck Centers',
  'Goodyear Commercial Tire',
]

const LOCATIONS = [
  'Main Service Center - Orlando, FL',
  'North Facility - Jacksonville, FL',
  'South Hub - Miami, FL',
  'West Terminal - Tampa, FL',
  'Mobile Service Unit - On-Site',
  'Vendor Location - External',
]

export class TaskEmulator {
  private static instance: TaskEmulator
  private tasks: Map<number, EmulatedTask> = new Map()
  private nextId = 1
  private pool: Pool | null = null

  private constructor() {
    // Generate initial 200+ tasks
    this.generateInitialTasks(250)
  }

  static getInstance(): TaskEmulator {
    if (!TaskEmulator.instance) {
      TaskEmulator.instance = new TaskEmulator()
    }
    return TaskEmulator.instance
  }

  /**
   * Initialize database connection pool
   * SECURITY: Uses parameterized queries only - never string concatenation
   */
  initializeDatabase(connectionString: string): void {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  /**
   * Generate a single task from template
   */
  private generateTask(
    id: number,
    template: { title: string; estimatedHours: number; tags: string[] },
    type: EmulatedTask['taskType']
  ): EmulatedTask {
    const now = new Date()
    const daysUntilDue = faker.number.int({ min: 1, max: 90 })
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + daysUntilDue)

    // Status distribution: 40% TODO, 30% IN_PROGRESS, 25% COMPLETED, 5% BLOCKED
    const statusRoll = Math.random()
    let status: EmulatedTask['status']
    if (statusRoll < 0.40) status = 'TODO'
    else if (statusRoll < 0.70) status = 'IN_PROGRESS'
    else if (statusRoll < 0.95) status = 'COMPLETED'
    else status = 'BLOCKED'

    // Priority distribution: 30% low, 40% medium, 25% high, 5% urgent
    const priorityRoll = Math.random()
    let priority: EmulatedTask['priority']
    if (priorityRoll < 0.30) priority = 'low'
    else if (priorityRoll < 0.70) priority = 'medium'
    else if (priorityRoll < 0.95) priority = 'high'
    else priority = 'urgent'

    const hasVehicle = Math.random() > 0.3
    const hasDriver = hasVehicle && Math.random() > 0.4

    let startDate: Date | undefined
    let completedDate: Date | undefined
    let actualHours: number | undefined
    let completionPercentage = 0

    if (status === 'IN_PROGRESS') {
      startDate = faker.date.between({ from: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), to: now })
      completionPercentage = faker.number.int({ min: 10, max: 90 })
      const maxActual = Math.max(template.estimatedHours * 0.8, 0.5)
      actualHours = faker.number.float({ min: 0.25, max: maxActual, precision: 0.25 })
    } else if (status === 'COMPLETED') {
      startDate = faker.date.between({ from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) })
      completedDate = new Date(startDate)
      // Ensure completed date is always after start date
      const additionalHours = Math.max(template.estimatedHours + faker.number.float({ min: -1, max: 4 }), 0.5)
      completedDate.setHours(completedDate.getHours() + additionalHours)
      completionPercentage = 100
      actualHours = faker.number.float({ min: template.estimatedHours * 0.7, max: template.estimatedHours * 1.3, precision: 0.25 })
    }

    const blockedReason = status === 'BLOCKED' ? this.generateBlockedReason() : undefined

    const driverNames = ['John Smith', 'Sarah Johnson', 'Mike Williams', 'Emma Davis', 'James Brown', 'Lisa Garcia', 'Robert Miller', 'Jennifer Wilson', 'David Martinez', 'Mary Anderson']

    const task: EmulatedTask = {
      id,
      taskId: `TSK-${String(id).padStart(5, '0')}`,
      title: template.title,
      description: this.generateDescription(template.title, type),
      taskType: type,
      status,
      priority,
      assignedToDriver: hasDriver ? faker.number.int({ min: 1, max: 50 }) : undefined,
      assignedDriverName: hasDriver ? driverNames[faker.number.int({ min: 0, max: driverNames.length - 1 })] : undefined,
      assignedToVehicle: hasVehicle ? faker.number.int({ min: 1, max: 50 }) : undefined,
      vehicleNumber: hasVehicle ? `V-${String(faker.number.int({ min: 1, max: 50 })).padStart(3, '0')}` : undefined,
      dependencies: [],
      dependencyTaskIds: [],
      dueDate,
      startDate,
      completedDate,
      estimatedHours: template.estimatedHours,
      actualHours,
      completionPercentage,
      blockedReason,
      tags: [...template.tags, type],
      createdBy: faker.person.fullName(),
      createdAt: faker.date.between({ from: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), to: now }),
      updatedAt: now,
      metadata: this.generateMetadata(type),
    }

    return task
  }

  /**
   * Generate task description
   */
  private generateDescription(title: string, type: string): string {
    const descriptions = {
      maintenance: `Perform ${title.toLowerCase()} as part of scheduled preventive maintenance program. Ensure all work follows manufacturer specifications and safety protocols.`,
      compliance: `Complete ${title.toLowerCase()} to maintain regulatory compliance. Document all findings and maintain records per federal/state requirements.`,
      inspection: `Conduct ${title.toLowerCase()} according to fleet safety standards. Report any deficiencies immediately and complete required documentation.`,
      procurement: `${title} to support ongoing fleet operations. Verify vendor credentials, obtain competitive quotes, and process through approved purchasing workflow.`,
      safety: `Execute ${title.toLowerCase()} to enhance fleet safety program. Follow established safety protocols and ensure all personnel are properly trained.`,
    }

    return descriptions[type as keyof typeof descriptions] || `Complete ${title.toLowerCase()} for fleet operations.`
  }

  /**
   * Generate task metadata
   */
  private generateMetadata(type: string): EmulatedTask['metadata'] {
    const metadata: EmulatedTask['metadata'] = {}

    if (type === 'maintenance' || type === 'inspection') {
      metadata.location = LOCATIONS[faker.number.int({ min: 0, max: LOCATIONS.length - 1 })]
      if (Math.random() > 0.5) {
        metadata.vendor = VENDORS[faker.number.int({ min: 0, max: VENDORS.length - 1 })]
      }
    }

    if (type === 'procurement') {
      metadata.vendor = VENDORS[faker.number.int({ min: 0, max: VENDORS.length - 1 })]
      metadata.cost = faker.number.float({ min: 50, max: 5000, precision: 0.01 })
    }

    if (type === 'maintenance') {
      metadata.parts = this.generatePartsList()
      metadata.cost = faker.number.float({ min: 100, max: 2000, precision: 0.01 })
    }

    if (Math.random() > 0.6) {
      metadata.notes = faker.lorem.sentence()
    }

    return metadata
  }

  /**
   * Generate parts list for maintenance tasks
   */
  private generatePartsList(): string[] {
    const parts = [
      'Oil Filter', 'Air Filter', 'Cabin Filter', 'Fuel Filter',
      'Spark Plugs', 'Brake Pads', 'Brake Rotors', 'Brake Fluid',
      'Coolant', 'Transmission Fluid', 'Power Steering Fluid',
      'Wiper Blades', 'Battery', 'Serpentine Belt', 'Timing Belt',
    ]

    const count = faker.number.int({ min: 1, max: 4 })
    const selectedParts: string[] = []

    for (let i = 0; i < count; i++) {
      const part = parts[faker.number.int({ min: 0, max: parts.length - 1 })]
      if (!selectedParts.includes(part)) {
        selectedParts.push(part)
      }
    }

    return selectedParts
  }

  /**
   * Generate blocked reason
   */
  private generateBlockedReason(): string {
    const reasons = [
      'Waiting for parts delivery',
      'Vehicle not available - in use',
      'Pending approval from management',
      'Technician not certified for this task',
      'Equipment not available',
      'Waiting for vendor quote',
      'Budget approval required',
      'Dependency task not completed',
      'Scheduled downtime conflict',
      'Weather conditions preventing work',
    ]

    return reasons[faker.number.int({ min: 0, max: reasons.length - 1 })]
  }

  /**
   * Generate initial task set
   */
  private generateInitialTasks(count: number): void {
    const taskTemplates = [
      ...MAINTENANCE_TASKS,
      ...COMPLIANCE_TASKS,
      ...INSPECTION_TASKS,
      ...PROCUREMENT_TASKS,
      ...SAFETY_TASKS,
    ]

    for (let i = 0; i < count; i++) {
      let template: { title: string; estimatedHours: number; tags: string[] }
      let type: EmulatedTask['taskType']

      // Distribute across task types
      const typeRoll = i % 5
      if (typeRoll === 0) {
        template = MAINTENANCE_TASKS[i % MAINTENANCE_TASKS.length]
        type = 'maintenance'
      } else if (typeRoll === 1) {
        template = COMPLIANCE_TASKS[i % COMPLIANCE_TASKS.length]
        type = 'compliance'
      } else if (typeRoll === 2) {
        template = INSPECTION_TASKS[i % INSPECTION_TASKS.length]
        type = 'inspection'
      } else if (typeRoll === 3) {
        template = PROCUREMENT_TASKS[i % PROCUREMENT_TASKS.length]
        type = 'procurement'
      } else {
        template = SAFETY_TASKS[i % SAFETY_TASKS.length]
        type = 'safety'
      }

      const task = this.generateTask(this.nextId, template, type)
      this.tasks.set(this.nextId, task)
      this.nextId++
    }

    // Add dependencies to 20% of tasks
    this.generateTaskDependencies()
  }

  /**
   * Generate task dependencies
   */
  private generateTaskDependencies(): void {
    const allTasks = Array.from(this.tasks.values())
    const tasksNeedingDeps = allTasks.filter(() => Math.random() < 0.20)

    for (const task of tasksNeedingDeps) {
      const depCount = faker.number.int({ min: 1, max: 3 })
      const potentialDeps = allTasks.filter(t => t.id !== task.id && t.id < task.id)

      if (potentialDeps.length > 0) {
        for (let i = 0; i < depCount && i < potentialDeps.length; i++) {
          const dep = potentialDeps[faker.number.int({ min: 0, max: potentialDeps.length - 1 })]
          if (!task.dependencies.includes(dep.id)) {
            task.dependencies.push(dep.id)
            task.dependencyTaskIds!.push(dep.taskId)
          }
        }
      }
    }
  }

  // ============================================================================
  // DATABASE OPERATIONS - ALL USE PARAMETERIZED QUERIES (Fortune 50 Security)
  // ============================================================================

  /**
   * Insert task into database
   * SECURITY: Parameterized query only - $1, $2, $3 placeholders
   */
  async insertTask(task: EmulatedTask): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized')

    const query = `
      INSERT INTO tasks (
        task_id, title, description, task_type, status, priority,
        assigned_to_driver, assigned_driver_name, assigned_to_vehicle, vehicle_number,
        dependencies, dependency_task_ids, due_date, start_date, completed_date,
        estimated_hours, actual_hours, completion_percentage, blocked_reason,
        tags, created_by, created_at, updated_at, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING id
    `

    const values = [
      task.taskId,
      task.title,
      task.description,
      task.taskType,
      task.status,
      task.priority,
      task.assignedToDriver,
      task.assignedDriverName,
      task.assignedToVehicle,
      task.vehicleNumber,
      task.dependencies,
      task.dependencyTaskIds,
      task.dueDate,
      task.startDate,
      task.completedDate,
      task.estimatedHours,
      task.actualHours,
      task.completionPercentage,
      task.blockedReason,
      task.tags,
      task.createdBy,
      task.createdAt,
      task.updatedAt,
      JSON.stringify(task.metadata),
    ]

    await this.pool.query(query, values)
  }

  /**
   * Bulk insert all tasks to database
   * SECURITY: Uses parameterized queries for each insert
   */
  async bulkInsertTasks(): Promise<{ inserted: number; failed: number }> {
    if (!this.pool) throw new Error('Database not initialized')

    let inserted = 0
    let failed = 0

    for (const task of this.tasks.values()) {
      try {
        await this.insertTask(task)
        inserted++
      } catch (error) {
        console.error(`Failed to insert task ${task.taskId}:`, error)
        failed++
      }
    }

    return { inserted, failed }
  }

  /**
   * Get tasks by status
   * SECURITY: Parameterized query - $1 placeholder
   */
  async getTasksByStatus(status: string): Promise<EmulatedTask[]> {
    if (!this.pool) throw new Error('Database not initialized')

    const query = 'SELECT id, tenant_id, task_title, description, task_type, priority, status, assigned_to, created_by, due_date, start_date, completed_date, estimated_hours, actual_hours, completion_percentage, vehicle_id, work_order_id, parent_task_id, tags, metadata, created_at, updated_at FROM tasks WHERE status = $1 ORDER BY due_date ASC'
    const result = await this.pool.query(query, [status])

    return result.rows as EmulatedTask[]
  }

  /**
   * Get tasks by vehicle
   * SECURITY: Parameterized query - $1 placeholder
   */
  async getTasksByVehicle(vehicleId: number): Promise<EmulatedTask[]> {
    if (!this.pool) throw new Error('Database not initialized')

    const query = 'SELECT id, tenant_id, task_title, description, task_type, priority, status, assigned_to, created_by, due_date, start_date, completed_date, estimated_hours, actual_hours, completion_percentage, vehicle_id, work_order_id, parent_task_id, tags, metadata, created_at, updated_at FROM tasks WHERE assigned_to_vehicle = $1 ORDER BY priority DESC, due_date ASC'
    const result = await this.pool.query(query, [vehicleId])

    return result.rows as EmulatedTask[]
  }

  /**
   * Update task status
   * SECURITY: Parameterized query - $1, $2, $3 placeholders
   */
  async updateTaskStatus(taskId: string, newStatus: string, completionPercentage?: number): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized')

    const query = `
      UPDATE tasks
      SET status = $1, completion_percentage = $2, updated_at = NOW()
      WHERE task_id = $3
    `
    await this.pool.query(query, [newStatus, completionPercentage || 0, taskId])
  }

  // ============================================================================
  // IN-MEMORY OPERATIONS (for emulator mode without database)
  // ============================================================================

  getAll(): EmulatedTask[] {
    return Array.from(this.tasks.values())
  }

  getById(id: number): EmulatedTask | undefined {
    return this.tasks.get(id)
  }

  getByTaskId(taskId: string): EmulatedTask | undefined {
    return Array.from(this.tasks.values()).find(t => t.taskId === taskId)
  }

  filterByStatus(status: string): EmulatedTask[] {
    return this.getAll().filter(t => t.status === status)
  }

  filterByType(type: string): EmulatedTask[] {
    return this.getAll().filter(t => t.taskType === type)
  }

  filterByPriority(priority: string): EmulatedTask[] {
    return this.getAll().filter(t => t.priority === priority)
  }

  filterByVehicle(vehicleId: number): EmulatedTask[] {
    return this.getAll().filter(t => t.assignedToVehicle === vehicleId)
  }

  filterByDriver(driverId: number): EmulatedTask[] {
    return this.getAll().filter(t => t.assignedToDriver === driverId)
  }

  getOverdueTasks(): EmulatedTask[] {
    const now = new Date()
    return this.getAll().filter(t =>
      (t.status === 'TODO' || t.status === 'IN_PROGRESS') &&
      t.dueDate < now
    )
  }

  getUpcomingTasks(days: number = 7): EmulatedTask[] {
    const now = new Date()
    const future = new Date(now)
    future.setDate(future.getDate() + days)

    return this.getAll().filter(t =>
      (t.status === 'TODO' || t.status === 'IN_PROGRESS') &&
      t.dueDate >= now &&
      t.dueDate <= future
    )
  }

  getStatistics(): {
    total: number
    byStatus: Record<string, number>
    byType: Record<string, number>
    byPriority: Record<string, number>
    overdue: number
    completed: number
    avgCompletionTime: number
  } {
    const tasks = this.getAll()

    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    let totalCompletionTime = 0
    let completedCount = 0

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1
      byType[task.taskType] = (byType[task.taskType] || 0) + 1
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1

      if (task.status === 'COMPLETED' && task.startDate && task.completedDate) {
        const duration = task.completedDate.getTime() - task.startDate.getTime()
        totalCompletionTime += duration
        completedCount++
      }
    }

    return {
      total: tasks.length,
      byStatus,
      byType,
      byPriority,
      overdue: this.getOverdueTasks().length,
      completed: completedCount,
      avgCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount / (1000 * 60 * 60) : 0, // hours
    }
  }

  /**
   * Emulate real-time task updates
   */
  emulateRealTimeUpdates(): void {
    setInterval(() => {
      const tasks = this.getAll().filter(t => t.status === 'IN_PROGRESS')
      if (tasks.length === 0) return

      const randomTask = tasks[faker.number.int({ min: 0, max: tasks.length - 1 })]

      // Update completion percentage
      if (randomTask.completionPercentage < 100) {
        randomTask.completionPercentage = Math.min(100, randomTask.completionPercentage + faker.number.int({ min: 5, max: 20 }))
        randomTask.updatedAt = new Date()

        if (randomTask.completionPercentage === 100) {
          randomTask.status = 'COMPLETED'
          randomTask.completedDate = new Date()
          randomTask.actualHours = randomTask.estimatedHours + faker.number.float({ min: -1, max: 2, precision: 0.25 })
        }

        this.tasks.set(randomTask.id, randomTask)
      }
    }, 30000) // Update every 30 seconds
  }
}

// Export singleton instance
export const taskEmulator = TaskEmulator.getInstance()

// Start real-time emulation
taskEmulator.emulateRealTimeUpdates()
