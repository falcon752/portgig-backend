module.exports = {
  apps: [{
    name: "portgig-backend",
    cwd: "/home/Portgig/apps/portgig-backend",
    script: "node",
    args: "-r dotenv/config ./src/index.js dotenv_config_path=/home/Portgig/apps/portgig-backend/.env.local dotenv_config_debug=true",
    env: {
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: "5007"
    },
    watch: false,
    autorestart: true,
    max_memory_restart: "400M"
  }, {
    name: "portgig-frontend",
    cwd: "/home/Portgig/apps/portgig-frontend",
    script: "node_modules/.bin/next",
    args: "start -p 3002",
    env: {
      NODE_ENV: "production",
      PORT: "3002"
    },
    watch: false,
    autorestart: true,
    max_memory_restart: "600M"
  }]
};
