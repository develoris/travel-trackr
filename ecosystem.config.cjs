module.exports = {
  apps: [
    {
      name: "travel-trackr",
      script: "dist/src/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M", // serve per limitare l'uso di memoria e prevenire crash
      // Keep secrets and server-specific values only on the server environment/.env.
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        APP_BASE_PATH: "/travelTracker",
        SESSION_COOKIE_SECURE: "false",
        ACCESS_TOKEN_TTL: "15m",
        REFRESH_TOKEN_DAYS: "30",
        ENABLE_DB_BACKUP_CRON: "true",
        DB_BACKUP_CRON: "0 3 * * *",
        DB_BACKUP_RUN_ON_STARTUP: "false",
        DB_BACKUP_RETENTION_COUNT: "7",
        BACKUP_OUTPUT_DIR: "./backups",
        BACKUP_DB_NAME: "travel-trackr"
      }
    }
  ]
};
