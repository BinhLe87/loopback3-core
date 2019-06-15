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
      env_local: {
        NODE_ENV: 'local'
      },
      env_aws: {
        NODE_ENV: 'aws'
      }
    },
    {
      name: 'service-rabbitmq',
      script: 'server/services/index.js',
      args: ["--service=rabbitmq"],
      out_file: 'logs/service-rabbitmq.log',
      autorestart: false,
      env: {
        NODE_ENV: 'staging'
      },
      env_development: {
        NODE_ENV: 'development'
      },
    }
  ]
};
