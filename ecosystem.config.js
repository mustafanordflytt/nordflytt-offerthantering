// PM2 Configuration for Production Deployment
module.exports = {
  apps: [{
    name: 'nordflytt-api',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 5000,
    
    // Health check
    min_uptime: '10s',
    max_restarts: 10,
    
    // Environment specific settings
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};