module.exports = {
    apps: [
        {
            name: 'gym-api',
            script: './build/bin/server.js',
      
            // Modo cluster para aproveitar múltiplos cores
            instances: 'max',
            exec_mode: 'cluster',
      
            // Variáveis de ambiente (também lê do .env)
            env_production: {
                NODE_ENV: 'production',
                PORT: 3333,
                HOST: '0.0.0.0',
            },
      
            env_staging: {
                NODE_ENV: 'production',
                PORT: 3334,
                HOST: '0.0.0.0',
            },
      
            env_development: {
                NODE_ENV: 'development',
                PORT: 3333,
                HOST: 'localhost',
            },
      
            // Logs
            error_file: './logs/pm2-err.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
      
            // Auto restart
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,
      
            // Limites de recursos
            max_memory_restart: '500M',
      
            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
      
            // Monitoramento
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'build'],
      
            // Cron restart (opcional - restart diário às 3h)
            // cron_restart: '0 3 * * *',
        },
    ],
}
