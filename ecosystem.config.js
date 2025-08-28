module.exports = {
  apps: [{
    name: "portgig",
    cwd: "/root/portgig",
    script: "node",
    // important: provide the dotenv path *after* the script
    // add debug if you want to see dotenv messages on boot
    args: "-r dotenv/config ./src/index.js dotenv_config_path=/root/portgig/.env.local dotenv_config_debug=true",
    env: {
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: "5007"
    },
    watch: false,
    autorestart: true,
    max_memory_restart: "400M"
  }]
};
