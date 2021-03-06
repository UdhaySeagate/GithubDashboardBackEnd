module.exports = {
  apps: [
    {
      name: 'github-node',
      script: './server.js',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'development',
        PORT: '9090',
        GITHUB_HOST: 'api.github.com',
        GITHUB_USERNAME: 'cortx-admin',
        GITHUB_PASSWORD: 'fb5df95aa37ac83e5d86da05d3cf262541dd4f6f',
        GITHUB_ORG: 'Seagate',
        MONGODB: 'mongodb://172.30.32.221:27017/github'
      }
    }
  ]
};
