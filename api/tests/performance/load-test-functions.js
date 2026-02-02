/**
 * Artillery Load Test Helper Functions
 */

const jwt = require('jsonwebtoken')

/**
 * Generate authentication token for testing
 */
function generateAuthToken(context, events, done) {
  const testUser = {
    id: 'test-user-id',
    tenant_id: 'test-tenant-id',
    email: 'loadtest@example.com',
    role: 'admin'
  }

  const token = jwt.sign(testUser, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  })

  context.vars.authToken = token
  return done()
}

/**
 * Generate random asset data
 */
function generateAssetData(context, events, done) {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)

  context.vars.assetName = `Load Test Asset ${timestamp}`
  context.vars.assetTag = `LT-${random}`
  context.vars.serialNumber = `SN-${timestamp}`

  return done()
}

/**
 * Generate random task data
 */
function generateTaskData(context, events, done) {
  const timestamp = Date.now()

  context.vars.taskTitle = `Load Test Task ${timestamp}`
  context.vars.taskDescription = `This is a load test task created at ${new Date().toISOString()}`

  return done()
}

module.exports = {
  generateAuthToken,
  generateAssetData,
  generateTaskData
}
