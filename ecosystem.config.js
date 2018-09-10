module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'server/api/server.js',
      env: {
        NODE_ENV: 'staging'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      instances: 2,
      exec_mode: 'cluster'
    },
    {
      name: 'redis-server',
      interpreter: '/bin/sh',
      script: 'script/start-redis.sh',
      out_file: 'logs/redis.log'
    }
  ]
};
