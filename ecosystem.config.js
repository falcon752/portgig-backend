module.exports = {
  apps: [{
    name: "portgig",
    cwd: "/root/portgig",
    script: "node",
    args: "-r dotenv/config ./src/index.js",   // preload dotenv
    env: {
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: "5007",
      // pm2 will pass this to dotenv/config:
      DOTENV_CONFIG_PATH: "/root/portgig/.env.local"
    },
    watch: false,
    autorestart: true,
    max_memory_restart: "400M"
  }]
};
