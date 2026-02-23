/**
 * Vehicle Scanner Proxy — forwards /api/vehicle-scanner/* to the Python
 * FastAPI service running on port 8000.
 *
 * Uses Node's built-in http module to proxy requests, including
 * multipart/form-data file uploads.
 */

import { Router, Request, Response } from 'express'
import http from 'http'

const router = Router()

const SCANNER_HOST = process.env.VEHICLE_SCANNER_HOST || 'localhost'
const SCANNER_PORT = parseInt(process.env.VEHICLE_SCANNER_PORT || '8000', 10)

/**
 * Proxy all requests to the Python vehicle scanner service.
 * Preserves method, headers, query string, and body (including multipart).
 */
router.all('/*', (req: Request, res: Response) => {
  // Build target path: strip /api/vehicle-scanner prefix
  const targetPath = req.originalUrl.replace(/^\/api\/vehicle-scanner/, '') || '/'

  const options: http.RequestOptions = {
    hostname: SCANNER_HOST,
    port: SCANNER_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${SCANNER_HOST}:${SCANNER_PORT}`,
    },
    timeout: 300_000, // 5 min timeout for large uploads + processing
  }

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })

  proxyReq.on('error', (err) => {
    console.error('[vehicle-scanner proxy] Connection error:', err.message)
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: 'Vehicle scanner service unavailable',
        detail: `Cannot connect to scanner at ${SCANNER_HOST}:${SCANNER_PORT}`,
      })
    }
  })

  proxyReq.on('timeout', () => {
    proxyReq.destroy()
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Vehicle scanner request timed out',
      })
    }
  })

  // Pipe the incoming request body (handles multipart/form-data, JSON, etc.)
  req.pipe(proxyReq, { end: true })
})

export default router
