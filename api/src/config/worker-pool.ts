/**
 * Worker Thread Pool Manager
 *
 * This module provides a worker thread pool for CPU-intensive operations
 * to prevent blocking the main event loop and improve application performance.
 *
 * Use cases:
 * - PDF generation
 * - Image processing (resize, compress)
 * - Report generation
 * - Data export operations (CSV, Excel)
 * - Complex calculations
 * - OCR processing
 */

import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import * as os from 'os'
import * as path from 'path'

interface WorkerTask {
  id: string
  taskType: string
  data: any
  priority: number
  createdAt: Date
  resolve: (value: any) => void
  reject: (error: any) => void
  timeout?: number
}

interface WorkerInfo {
  worker: Worker
  busy: boolean
  currentTask: WorkerTask | null
  tasksCompleted: number
  errors: number
  createdAt: Date
}

export interface WorkerPoolConfig {
  minWorkers?: number
  maxWorkers?: number
  idleTimeout?: number
  taskTimeout?: number
  workerScript?: string
}

export class WorkerPool extends EventEmitter {
  private workers: Map<number, WorkerInfo> = new Map()
  private taskQueue: WorkerTask[] = []
  private config: Required<WorkerPoolConfig>
  private nextWorkerId: number = 0
  private totalTasksProcessed: number = 0
  private totalErrors: number = 0

  constructor(config: WorkerPoolConfig = {}) {
    super()

    // Default configuration
    this.config = {
      minWorkers: config.minWorkers || 2,
      maxWorkers: config.maxWorkers || Math.max(4, os.cpus().length - 1),
      idleTimeout: config.idleTimeout || 300000, // 5 minutes
      taskTimeout: config.taskTimeout || 120000, // 2 minutes
      workerScript: config.workerScript || path.join(__dirname, '../workers/task-worker.js')
    }

    // Initialize minimum workers
    this.initializeWorkers()
  }

  /**
   * Initialize the minimum number of workers
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker()
    }

    console.log(`✅ Worker pool initialized with ${this.config.minWorkers} workers (max: ${this.config.maxWorkers})`)
  }

  /**
   * Create a new worker
   */
  private createWorker(): Worker {
    const workerId = this.nextWorkerId++
    const worker = new Worker(this.config.workerScript)

    const workerInfo: WorkerInfo = {
      worker,
      busy: false,
      currentTask: null,
      tasksCompleted: 0,
      errors: 0,
      createdAt: new Date()
    }

    // Setup worker event handlers
    worker.on('message', (result) => {
      const task = workerInfo.currentTask
      if (task) {
        task.resolve(result)
        workerInfo.tasksCompleted++
        this.totalTasksProcessed++
        this.emit('taskComplete', { taskId: task.id, workerId, result })
      }

      // Mark worker as available
      workerInfo.busy = false
      workerInfo.currentTask = null

      // Process next task in queue
      this.processNextTask()
    })

    worker.on('error', (error) => {
      const task = workerInfo.currentTask
      if (task) {
        task.reject(error)
        workerInfo.errors++
        this.totalErrors++
        this.emit('taskError', { taskId: task.id, workerId, error })
      }

      // Mark worker as available
      workerInfo.busy = false
      workerInfo.currentTask = null

      // Log error
      console.error(`[Worker ${workerId}] Error:`, error)

      // Process next task
      this.processNextTask()
    })

    worker.on('exit', (code) => {
      console.log(`[Worker ${workerId}] Exited with code ${code}`)
      this.workers.delete(workerId)

      // If we're below minimum workers, create a new one
      if (this.workers.size < this.config.minWorkers) {
        this.createWorker()
      }
    })

    this.workers.set(workerId, workerInfo)
    this.emit('workerCreated', { workerId, totalWorkers: this.workers.size })

    return worker
  }

  /**
   * Execute a task on a worker thread
   */
  async execute<T = any>(taskType: string, data: any, options: { priority?: number; timeout?: number } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskType,
        data,
        priority: options.priority || 0,
        createdAt: new Date(),
        resolve,
        reject,
        timeout: options.timeout || this.config.taskTimeout
      }

      // Add task to queue (sorted by priority)
      this.taskQueue.push(task)
      this.taskQueue.sort((a, b) => b.priority - a.priority)

      this.emit('taskQueued', { taskId: task.id, queueLength: this.taskQueue.length })

      // Try to process immediately
      this.processNextTask()

      // Setup task timeout
      if (task.timeout) {
        setTimeout(() => {
          const taskIndex = this.taskQueue.findIndex(t => t.id === task.id)
          if (taskIndex !== -1) {
            this.taskQueue.splice(taskIndex, 1)
            task.reject(new Error(`Task timeout after ${task.timeout}ms`))
          }
        }, task.timeout)
      }
    })
  }

  /**
   * Process the next task in the queue
   */
  private processNextTask(): void {
    // Check if there are tasks to process
    if (this.taskQueue.length === 0) {
      return
    }

    // Find an available worker
    let availableWorker: [number, WorkerInfo] | undefined

    for (const [workerId, workerInfo] of this.workers.entries()) {
      if (!workerInfo.busy) {
        availableWorker = [workerId, workerInfo]
        break
      }
    }

    // If no workers available, try to create one (up to max)
    if (!availableWorker && this.workers.size < this.config.maxWorkers) {
      const worker = this.createWorker()
      const workerId = this.nextWorkerId - 1
      availableWorker = [workerId, this.workers.get(workerId)!]
    }

    // If still no worker available, wait
    if (!availableWorker) {
      return
    }

    // Get next task
    const task = this.taskQueue.shift()
    if (!task) {
      return
    }

    const [workerId, workerInfo] = availableWorker

    // Assign task to worker
    workerInfo.busy = true
    workerInfo.currentTask = task

    // Send task to worker
    workerInfo.worker.postMessage({
      taskId: task.id,
      taskType: task.taskType,
      data: task.data
    })

    this.emit('taskStarted', { taskId: task.id, workerId, queueLength: this.taskQueue.length })
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const workers = Array.from(this.workers.values())

    return {
      workers: {
        total: this.workers.size,
        busy: workers.filter(w => w.busy).length,
        idle: workers.filter(w => !w.busy).length
      },
      tasks: {
        queued: this.taskQueue.length,
        totalProcessed: this.totalTasksProcessed,
        totalErrors: this.totalErrors
      },
      config: {
        minWorkers: this.config.minWorkers,
        maxWorkers: this.config.maxWorkers,
        taskTimeout: this.config.taskTimeout
      },
      performance: {
        averageTasksPerWorker: this.totalTasksProcessed / this.workers.size,
        errorRate: (this.totalErrors / Math.max(this.totalTasksProcessed, 1) * 100).toFixed(2) + '%'
      }
    }
  }

  /**
   * Get detailed worker information
   */
  getWorkerInfo() {
    const info: any[] = []

    for (const [workerId, workerInfo] of this.workers.entries()) {
      info.push({
        workerId,
        busy: workerInfo.busy,
        currentTask: workerInfo.currentTask ? {
          id: workerInfo.currentTask.id,
          type: workerInfo.currentTask.taskType,
          age: Date.now() - workerInfo.currentTask.createdAt.getTime()
        } : null,
        tasksCompleted: workerInfo.tasksCompleted,
        errors: workerInfo.errors,
        uptime: Date.now() - workerInfo.createdAt.getTime()
      })
    }

    return info
  }

  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down worker pool...')

    // Reject all queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker pool shutting down'))
    }
    this.taskQueue = []

    // Terminate all workers
    const terminatePromises: Promise<number>[] = []

    for (const [workerId, workerInfo] of this.workers.entries()) {
      terminatePromises.push(workerInfo.worker.terminate())
    }

    await Promise.all(terminatePromises)
    this.workers.clear()

    console.log('✅ Worker pool shutdown complete')
  }
}

// Singleton instance
export const workerPool = new WorkerPool()

/**
 * Convenience functions for common operations
 */

export async function processPDF(data: any): Promise<any> {
  return workerPool.execute('pdf', data, { priority: 5 })
}

export async function processImage(data: any): Promise<any> {
  return workerPool.execute('image', data, { priority: 3 })
}

export async function generateReport(data: any): Promise<any> {
  return workerPool.execute('report', data, { priority: 2 })
}

export async function exportData(data: any): Promise<any> {
  return workerPool.execute('export', data, { priority: 1 })
}

export async function processOCR(data: any): Promise<any> {
  return workerPool.execute('ocr', data, { priority: 4, timeout: 180000 })
}

export default workerPool
