/**
 * Task Emulator Tests
 * Comprehensive test suite for the Task Management Emulator
 */

import { describe, it, expect, beforeEach } from 'vitest'

import { TaskEmulator } from '../TaskEmulator'

describe('TaskEmulator', () => {
  let taskEmulator: TaskEmulator

  beforeEach(() => {
    // Get fresh instance for each test
    taskEmulator = TaskEmulator.getInstance()
  })

  describe('Initial Task Generation', () => {
    it('should generate 200+ tasks on initialization', () => {
      const allTasks = taskEmulator.getAll()
      expect(allTasks.length).toBeGreaterThanOrEqual(200)
    })

    it('should have unique task IDs', () => {
      const allTasks = taskEmulator.getAll()
      const taskIds = allTasks.map(t => t.taskId)
      const uniqueIds = new Set(taskIds)
      expect(uniqueIds.size).toBe(taskIds.length)
    })

    it('should have unique numeric IDs', () => {
      const allTasks = taskEmulator.getAll()
      const ids = allTasks.map(t => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should generate tasks with valid task IDs in TSK-XXXXX format', () => {
      const allTasks = taskEmulator.getAll()
      const taskIdPattern = /^TSK-\d{5}$/

      allTasks.forEach(task => {
        expect(task.taskId).toMatch(taskIdPattern)
      })
    })
  })

  describe('Task Types Distribution', () => {
    it('should have all 5 task types', () => {
      const allTasks = taskEmulator.getAll()
      const types = new Set(allTasks.map(t => t.taskType))

      expect(types).toContain('maintenance')
      expect(types).toContain('compliance')
      expect(types).toContain('inspection')
      expect(types).toContain('procurement')
      expect(types).toContain('safety')
      expect(types.size).toBe(5)
    })

    it('should filter tasks by type correctly', () => {
      const maintenanceTasks = taskEmulator.filterByType('maintenance')
      expect(maintenanceTasks.length).toBeGreaterThan(0)
      maintenanceTasks.forEach(task => {
        expect(task.taskType).toBe('maintenance')
      })
    })

    it('should have reasonable distribution of task types', () => {
      const allTasks = taskEmulator.getAll()
      const types = ['maintenance', 'compliance', 'inspection', 'procurement', 'safety']

      types.forEach(type => {
        const tasksOfType = taskEmulator.filterByType(type)
        // Each type should have at least 10% of total tasks
        expect(tasksOfType.length).toBeGreaterThan(allTasks.length * 0.10)
      })
    })
  })

  describe('Task Status Distribution', () => {
    it('should have all 4 status types', () => {
      const allTasks = taskEmulator.getAll()
      const statuses = new Set(allTasks.map(t => t.status))

      expect(statuses).toContain('TODO')
      expect(statuses).toContain('IN_PROGRESS')
      expect(statuses).toContain('COMPLETED')
      expect(statuses).toContain('BLOCKED')
    })

    it('should filter tasks by status correctly', () => {
      const todoTasks = taskEmulator.filterByStatus('TODO')
      expect(todoTasks.length).toBeGreaterThan(0)
      todoTasks.forEach(task => {
        expect(task.status).toBe('TODO')
      })
    })

    it('should have TODO as most common status', () => {
      const allTasks = taskEmulator.getAll()
      const todoTasks = taskEmulator.filterByStatus('TODO')

      // TODO should be around 40% of tasks
      expect(todoTasks.length).toBeGreaterThan(allTasks.length * 0.30)
    })

    it('should have IN_PROGRESS tasks with partial completion', () => {
      const inProgressTasks = taskEmulator.filterByStatus('IN_PROGRESS')

      inProgressTasks.forEach(task => {
        expect(task.completionPercentage).toBeGreaterThan(0)
        expect(task.completionPercentage).toBeLessThan(100)
        expect(task.startDate).toBeDefined()
        expect(task.actualHours).toBeDefined()
      })
    })

    it('should have COMPLETED tasks with 100% completion', () => {
      const completedTasks = taskEmulator.filterByStatus('COMPLETED')

      completedTasks.forEach(task => {
        expect(task.completionPercentage).toBe(100)
        expect(task.startDate).toBeDefined()
        expect(task.completedDate).toBeDefined()
        expect(task.actualHours).toBeDefined()
      })
    })

    it('should have BLOCKED tasks with blocked reasons', () => {
      const blockedTasks = taskEmulator.filterByStatus('BLOCKED')

      blockedTasks.forEach(task => {
        expect(task.blockedReason).toBeDefined()
        expect(task.blockedReason).not.toBe('')
      })
    })
  })

  describe('Task Priority Distribution', () => {
    it('should have all 4 priority levels', () => {
      const allTasks = taskEmulator.getAll()
      const priorities = new Set(allTasks.map(t => t.priority))

      expect(priorities).toContain('low')
      expect(priorities).toContain('medium')
      expect(priorities).toContain('high')
      expect(priorities).toContain('urgent')
    })

    it('should filter tasks by priority correctly', () => {
      const urgentTasks = taskEmulator.filterByPriority('urgent')
      expect(urgentTasks.length).toBeGreaterThan(0)
      urgentTasks.forEach(task => {
        expect(task.priority).toBe('urgent')
      })
    })

    it('should have medium as most common priority', () => {
      const allTasks = taskEmulator.getAll()
      const mediumTasks = taskEmulator.filterByPriority('medium')

      // Medium should be around 40% of tasks
      expect(mediumTasks.length).toBeGreaterThan(allTasks.length * 0.30)
    })
  })

  describe('Task Assignments', () => {
    it('should have tasks assigned to vehicles', () => {
      const vehicleAssignedTasks = taskEmulator.getAll().filter(t => t.assignedToVehicle)
      expect(vehicleAssignedTasks.length).toBeGreaterThan(0)
    })

    it('should have tasks assigned to drivers', () => {
      const driverAssignedTasks = taskEmulator.getAll().filter(t => t.assignedToDriver)
      expect(driverAssignedTasks.length).toBeGreaterThan(0)
    })

    it('should filter tasks by vehicle correctly', () => {
      const allTasks = taskEmulator.getAll()
      const vehicleWithTasks = allTasks.find(t => t.assignedToVehicle)

      if (vehicleWithTasks) {
        const vehicleTasks = taskEmulator.filterByVehicle(vehicleWithTasks.assignedToVehicle!)
        expect(vehicleTasks.length).toBeGreaterThan(0)
        vehicleTasks.forEach(task => {
          expect(task.assignedToVehicle).toBe(vehicleWithTasks.assignedToVehicle)
        })
      }
    })

    it('should filter tasks by driver correctly', () => {
      const allTasks = taskEmulator.getAll()
      const taskWithDriver = allTasks.find(t => t.assignedToDriver)

      if (taskWithDriver) {
        const driverTasks = taskEmulator.filterByDriver(taskWithDriver.assignedToDriver!)
        expect(driverTasks.length).toBeGreaterThan(0)
        driverTasks.forEach(task => {
          expect(task.assignedToDriver).toBe(taskWithDriver.assignedToDriver)
        })
      }
    })

    it('should have vehicle numbers when assigned to vehicles', () => {
      const vehicleAssignedTasks = taskEmulator.getAll().filter(t => t.assignedToVehicle)

      vehicleAssignedTasks.forEach(task => {
        expect(task.vehicleNumber).toBeDefined()
        expect(task.vehicleNumber).toMatch(/^V-\d{3}$/)
      })
    })

    it('should have driver names when assigned to drivers', () => {
      const driverAssignedTasks = taskEmulator.getAll().filter(t => t.assignedToDriver)

      driverAssignedTasks.forEach(task => {
        expect(task.assignedDriverName).toBeDefined()
        expect(task.assignedDriverName!.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Task Dependencies', () => {
    it('should have some tasks with dependencies', () => {
      const tasksWithDeps = taskEmulator.getAll().filter(t => t.dependencies.length > 0)
      expect(tasksWithDeps.length).toBeGreaterThan(0)
    })

    it('should have matching dependency task IDs', () => {
      const tasksWithDeps = taskEmulator.getAll().filter(t => t.dependencies.length > 0)

      tasksWithDeps.forEach(task => {
        expect(task.dependencyTaskIds?.length).toBe(task.dependencies.length)
      })
    })

    it('should have valid dependency references', () => {
      const allTasks = taskEmulator.getAll()
      const tasksWithDeps = allTasks.filter(t => t.dependencies.length > 0)

      tasksWithDeps.forEach(task => {
        task.dependencies.forEach(depId => {
          const depTask = taskEmulator.getById(depId)
          expect(depTask).toBeDefined()
          // Dependency should come before dependent task
          expect(depTask!.id).toBeLessThan(task.id)
        })
      })
    })
  })

  describe('Task Dates and Timing', () => {
    it('should have all tasks with due dates', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        expect(task.dueDate).toBeInstanceOf(Date)
      })
    })

    it('should have future due dates for TODO and IN_PROGRESS tasks', () => {
      const now = new Date()
      const activeTasks = taskEmulator.getAll().filter(
        t => t.status === 'TODO' || t.status === 'IN_PROGRESS'
      )

      // Some should be future, some might be overdue
      const futureTasks = activeTasks.filter(t => t.dueDate > now)
      expect(futureTasks.length).toBeGreaterThan(0)
    })

    it('should have estimated hours for all tasks', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        expect(task.estimatedHours).toBeGreaterThan(0)
        expect(task.estimatedHours).toBeLessThanOrEqual(10)
      })
    })

    it('should have valid date progression for completed tasks', () => {
      const completedTasks = taskEmulator.filterByStatus('COMPLETED')

      completedTasks.forEach(task => {
        if (task.startDate && task.completedDate) {
          expect(task.startDate.getTime()).toBeLessThanOrEqual(task.completedDate.getTime())
        }
      })
    })
  })

  describe('Task Metadata', () => {
    it('should have all tasks with metadata objects', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        expect(task.metadata).toBeDefined()
        expect(typeof task.metadata).toBe('object')
      })
    })

    it('should have locations for maintenance and inspection tasks', () => {
      const maintTasks = taskEmulator.filterByType('maintenance')
      const inspTasks = taskEmulator.filterByType('inspection')
      const combined = [...maintTasks, ...inspTasks]

      const withLocation = combined.filter(t => t.metadata.location)
      expect(withLocation.length).toBeGreaterThan(0)
    })

    it('should have vendors for procurement tasks', () => {
      const procurementTasks = taskEmulator.filterByType('procurement')

      procurementTasks.forEach(task => {
        expect(task.metadata.vendor).toBeDefined()
      })
    })

    it('should have costs for maintenance and procurement tasks', () => {
      const maintTasks = taskEmulator.filterByType('maintenance')
      const procTasks = taskEmulator.filterByType('procurement')

      const withCost = [...maintTasks, ...procTasks].filter(t => t.metadata.cost)
      expect(withCost.length).toBeGreaterThan(0)
    })

    it('should have parts lists for some maintenance tasks', () => {
      const maintTasks = taskEmulator.filterByType('maintenance')
      const withParts = maintTasks.filter(t => t.metadata.parts && t.metadata.parts.length > 0)

      expect(withParts.length).toBeGreaterThan(0)
    })
  })

  describe('Task Tags', () => {
    it('should have all tasks with tags', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        expect(task.tags).toBeDefined()
        expect(Array.isArray(task.tags)).toBe(true)
        expect(task.tags.length).toBeGreaterThan(0)
      })
    })

    it('should include task type in tags', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        expect(task.tags).toContain(task.taskType)
      })
    })
  })

  describe('Query Methods', () => {
    it('should retrieve task by ID', () => {
      const allTasks = taskEmulator.getAll()
      const firstTask = allTasks[0]

      const retrieved = taskEmulator.getById(firstTask.id)
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(firstTask.id)
    })

    it('should retrieve task by task ID', () => {
      const allTasks = taskEmulator.getAll()
      const firstTask = allTasks[0]

      const retrieved = taskEmulator.getByTaskId(firstTask.taskId)
      expect(retrieved).toBeDefined()
      expect(retrieved!.taskId).toBe(firstTask.taskId)
    })

    it('should return undefined for non-existent ID', () => {
      const retrieved = taskEmulator.getById(999999)
      expect(retrieved).toBeUndefined()
    })

    it('should return undefined for non-existent task ID', () => {
      const retrieved = taskEmulator.getByTaskId('TSK-99999')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('Overdue Tasks', () => {
    it('should identify overdue tasks', () => {
      const overdueTasks = taskEmulator.getOverdueTasks()

      overdueTasks.forEach(task => {
        expect(task.status === 'TODO' || task.status === 'IN_PROGRESS').toBe(true)
        expect(task.dueDate.getTime()).toBeLessThan(Date.now())
      })
    })

    it('should not include completed or blocked tasks in overdue', () => {
      const overdueTasks = taskEmulator.getOverdueTasks()

      overdueTasks.forEach(task => {
        expect(task.status).not.toBe('COMPLETED')
      })
    })
  })

  describe('Upcoming Tasks', () => {
    it('should get upcoming tasks within 7 days', () => {
      const upcomingTasks = taskEmulator.getUpcomingTasks(7)
      const now = new Date()
      const future = new Date(now)
      future.setDate(future.getDate() + 7)

      upcomingTasks.forEach(task => {
        expect(task.status === 'TODO' || task.status === 'IN_PROGRESS').toBe(true)
        expect(task.dueDate.getTime()).toBeGreaterThanOrEqual(now.getTime())
        expect(task.dueDate.getTime()).toBeLessThanOrEqual(future.getTime())
      })
    })

    it('should get upcoming tasks within custom days', () => {
      const upcomingTasks = taskEmulator.getUpcomingTasks(30)
      const now = new Date()
      const future = new Date(now)
      future.setDate(future.getDate() + 30)

      upcomingTasks.forEach(task => {
        expect(task.dueDate.getTime()).toBeGreaterThanOrEqual(now.getTime())
        expect(task.dueDate.getTime()).toBeLessThanOrEqual(future.getTime())
      })
    })
  })

  describe('Statistics', () => {
    it('should calculate comprehensive statistics', () => {
      const stats = taskEmulator.getStatistics()

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byStatus).toBeDefined()
      expect(stats.byType).toBeDefined()
      expect(stats.byPriority).toBeDefined()
      expect(stats.overdue).toBeGreaterThanOrEqual(0)
      expect(stats.completed).toBeGreaterThanOrEqual(0)
      expect(stats.avgCompletionTime).toBeGreaterThanOrEqual(0)
    })

    it('should have correct total count', () => {
      const stats = taskEmulator.getStatistics()
      const allTasks = taskEmulator.getAll()

      expect(stats.total).toBe(allTasks.length)
    })

    it('should have correct status breakdown', () => {
      const stats = taskEmulator.getStatistics()
      const allTasks = taskEmulator.getAll()

      const statusCounts = {
        TODO: taskEmulator.filterByStatus('TODO').length,
        IN_PROGRESS: taskEmulator.filterByStatus('IN_PROGRESS').length,
        COMPLETED: taskEmulator.filterByStatus('COMPLETED').length,
        BLOCKED: taskEmulator.filterByStatus('BLOCKED').length,
      }

      expect(stats.byStatus.TODO).toBe(statusCounts.TODO)
      expect(stats.byStatus.IN_PROGRESS).toBe(statusCounts.IN_PROGRESS)
      expect(stats.byStatus.COMPLETED).toBe(statusCounts.COMPLETED)
      expect(stats.byStatus.BLOCKED).toBe(statusCounts.BLOCKED)
    })

    it('should have correct type breakdown', () => {
      const stats = taskEmulator.getStatistics()

      const typeCounts = {
        maintenance: taskEmulator.filterByType('maintenance').length,
        compliance: taskEmulator.filterByType('compliance').length,
        inspection: taskEmulator.filterByType('inspection').length,
        procurement: taskEmulator.filterByType('procurement').length,
        safety: taskEmulator.filterByType('safety').length,
      }

      expect(stats.byType.maintenance).toBe(typeCounts.maintenance)
      expect(stats.byType.compliance).toBe(typeCounts.compliance)
      expect(stats.byType.inspection).toBe(typeCounts.inspection)
      expect(stats.byType.procurement).toBe(typeCounts.procurement)
      expect(stats.byType.safety).toBe(typeCounts.safety)
    })

    it('should have correct overdue count', () => {
      const stats = taskEmulator.getStatistics()
      const overdueTasks = taskEmulator.getOverdueTasks()

      expect(stats.overdue).toBe(overdueTasks.length)
    })

    it('should have correct completed count', () => {
      const stats = taskEmulator.getStatistics()
      const completedTasks = taskEmulator.filterByStatus('COMPLETED')

      expect(stats.completed).toBe(completedTasks.length)
    })
  })

  describe('Data Validation', () => {
    it('should have valid task structures', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        // Required fields
        expect(task.id).toBeDefined()
        expect(task.taskId).toBeDefined()
        expect(task.title).toBeDefined()
        expect(task.description).toBeDefined()
        expect(task.taskType).toBeDefined()
        expect(task.status).toBeDefined()
        expect(task.priority).toBeDefined()
        expect(task.dueDate).toBeDefined()
        expect(task.estimatedHours).toBeDefined()
        expect(task.completionPercentage).toBeDefined()
        expect(task.tags).toBeDefined()
        expect(task.createdBy).toBeDefined()
        expect(task.createdAt).toBeDefined()
        expect(task.updatedAt).toBeDefined()
        expect(task.metadata).toBeDefined()

        // Data types
        expect(typeof task.id).toBe('number')
        expect(typeof task.taskId).toBe('string')
        expect(typeof task.title).toBe('string')
        expect(typeof task.description).toBe('string')
        expect(typeof task.completionPercentage).toBe('number')

        // Valid ranges
        expect(task.completionPercentage).toBeGreaterThanOrEqual(0)
        expect(task.completionPercentage).toBeLessThanOrEqual(100)
      })
    })

    it('should have valid status values', () => {
      const allTasks = taskEmulator.getAll()
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']

      allTasks.forEach(task => {
        expect(validStatuses).toContain(task.status)
      })
    })

    it('should have valid priority values', () => {
      const allTasks = taskEmulator.getAll()
      const validPriorities = ['low', 'medium', 'high', 'urgent']

      allTasks.forEach(task => {
        expect(validPriorities).toContain(task.priority)
      })
    })

    it('should have valid task type values', () => {
      const allTasks = taskEmulator.getAll()
      const validTypes = ['maintenance', 'compliance', 'inspection', 'procurement', 'safety']

      allTasks.forEach(task => {
        expect(validTypes).toContain(task.taskType)
      })
    })
  })

  describe('Security Validation', () => {
    it('should not have SQL injection patterns in task data', () => {
      const allTasks = taskEmulator.getAll()
      const sqlPatterns = [
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /INSERT\s+INTO/i,
        /UPDATE\s+\w+\s+SET/i,
        /--;/,
        /\/\*/,
        /xp_cmdshell/i,
      ]

      allTasks.forEach(task => {
        const taskString = JSON.stringify(task)
        sqlPatterns.forEach(pattern => {
          expect(taskString).not.toMatch(pattern)
        })
      })
    })

    it('should have properly escaped strings', () => {
      const allTasks = taskEmulator.getAll()

      allTasks.forEach(task => {
        // Check that titles and descriptions don't have unescaped quotes
        expect(task.title).not.toMatch(/[^\\]'/)
        expect(task.description).not.toMatch(/[^\\]'/)
      })
    })
  })
})
