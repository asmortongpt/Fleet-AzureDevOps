// Minimal working Fleet API server for emergency deployment
import cors from 'cors'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-minimal',
    service: 'fleet-api'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Fleet API - Minimal Version',
    version: '1.0.0-minimal',
    endpoints: {
      health: '/api/health'
    }
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`Fleet API (minimal) running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
