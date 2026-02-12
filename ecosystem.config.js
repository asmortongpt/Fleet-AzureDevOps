/**
 * PM2 Ecosystem Configuration for Fleet Management System
 * Production-ready process management with clustering and monitoring
 */

module.exports = {
  apps: [
    {
      // ====================================================================
      // API Server - Clustered for High Availability
      // ====================================================================
      name: 'fleet-api',
      script: './api/dist/server.js',
      cwd: '/opt/fleet-management',
      instances: 4,
      exec_mode: 'cluster',

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3001,

        // Database configuration
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_NAME: process.env.DB_NAME || 'fleet_production',
        DB_USER: process.env.DB_USER || 'fleet_user',
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_SSL: process.env.DB_SSL || 'true',

        // Azure configuration
        AZURE_SQL_SERVER: process.env.AZURE_SQL_SERVER,
        AZURE_SQL_DATABASE: process.env.AZURE_SQL_DATABASE,
        AZURE_SQL_USERNAME: process.env.AZURE_SQL_USERNAME,
        AZURE_SQL_PASSWORD: process.env.AZURE_SQL_PASSWORD,

        // Authentication
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

        // Azure AD
        AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
        AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
        AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,

        // Redis configuration
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_TLS: process.env.REDIS_TLS || 'false',

        // Storage configuration
        AZURE_STORAGE_ACCOUNT: process.env.AZURE_STORAGE_ACCOUNT,
        AZURE_STORAGE_KEY: process.env.AZURE_STORAGE_KEY,
        AZURE_STORAGE_CONTAINER: process.env.AZURE_STORAGE_CONTAINER || 'fleet-documents',

        // Email configuration
        EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.office365.com',
        EMAIL_PORT: process.env.EMAIL_PORT || 587,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS,
        EMAIL_USE_TLS: process.env.EMAIL_USE_TLS || 'true',

        // Application URLs
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://proud-bay-0fdc8040f.3.azurestaticapps.net',
        API_URL: process.env.API_URL || 'http://localhost:3001',

        // Feature flags
        ENABLE_WEBSOCKETS: process.env.ENABLE_WEBSOCKETS || 'true',
        ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS || 'true',
        ENABLE_AI_FEATURES: process.env.ENABLE_AI_FEATURES || 'false',

        // Monitoring
        SENTRY_DSN: process.env.SENTRY_DSN,
        DATADOG_API_KEY: process.env.DATADOG_API_KEY,
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      },

      // Logging configuration
      error_file: '/var/log/fleet-management/api-error.log',
      out_file: '/var/log/fleet-management/api-out.log',
      log_file: '/var/log/fleet-management/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Process management
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Advanced PM2 features
      instance_var: 'INSTANCE_ID',
      source_map_support: true,

      // Health monitoring
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
    },

    // ====================================================================
    // Frontend Static Server (if serving from Node)
    // ====================================================================
    {
      name: 'fleet-frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      cwd: '/opt/fleet-management',
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging configuration
      error_file: '/var/log/fleet-management/frontend-error.log',
      out_file: '/var/log/fleet-management/frontend-out.log',
      log_file: '/var/log/fleet-management/frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },

    // ====================================================================
    // Background Job Worker (Optional - if using Bull/PgBoss)
    // ====================================================================
    {
      name: 'fleet-worker',
      script: './api/dist/workers/job-processor.js',
      cwd: '/opt/fleet-management',
      instances: 2,
      exec_mode: 'cluster',

      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Environment variables (inherit from API)
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY || '5',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_NAME: process.env.DB_NAME || 'fleet_production',
        DB_USER: process.env.DB_USER || 'fleet_user',
        DB_PASSWORD: process.env.DB_PASSWORD,
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      },

      // Logging configuration
      error_file: '/var/log/fleet-management/worker-error.log',
      out_file: '/var/log/fleet-management/worker-out.log',
      log_file: '/var/log/fleet-management/worker-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Disable if workers are not needed
      autorestart: process.env.ENABLE_WORKERS === 'true',
    },
  ],

  // ====================================================================
  // Deployment Configuration
  // ====================================================================
  deploy: {
    production: {
      user: 'fleetapp',
      host: process.env.DEPLOY_HOST || 'fleet-vm.eastus.cloudapp.azure.com',
      ref: 'origin/main',
      repo: 'https://github.com/CapitalTechHub/Fleet.git',
      path: '/opt/fleet-management',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
    },

    staging: {
      user: 'fleetapp',
      host: process.env.STAGING_HOST || 'fleet-staging-vm.eastus.cloudapp.azure.com',
      ref: 'origin/staging',
      repo: 'https://github.com/CapitalTechHub/Fleet.git',
      path: '/opt/fleet-management-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
    },
  },
};
