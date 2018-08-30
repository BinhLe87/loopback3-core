module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'server/server.js',
      env: {
        NODE_ENV: 'staging'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'api-docs',
      interpreter: '/bin/sh',
      script: './start-api-website.sh',
      out_file: 'logs/pm2.log'
    },
    {
      name: 'redis-server',
      script: '../tool/redis/redis-4.0.11/src/redis-server --daemonize yes',
      out_file: 'logs/redis.log'
    }
  ]
};
