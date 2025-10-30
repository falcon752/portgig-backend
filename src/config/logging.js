const { createLogger, format, transports } = require("winston");
const { combine, printf, label, timestamp, splat, colorize } = format;
const wistondb = require("winston-mongodb");
const { format: dateFormater } = require("date-fns");
const appLogFormat = printf(({ level, message, label, timestamp }) => {
  return `[${label.toUpperCase()}]- ${level}: ${dateFormater(
    new Date(timestamp),
    "dd-MMM-yyyy hh:mm -a"
  )} --- ${message}]`;
});

function getLogger(name) {
  return createLogger({
    format: combine(
      label({ label: name }),
      timestamp(),
      colorize(),
      splat(),
      appLogFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: "app.log" }),
      new transports.MongoDB({
        db: process.env.DATABASE_URL,
        collection: "log",
        options: { useUnifiedTopology: true },
      }),
    ],
  });
}

const appLogger = getLogger("PORTGIG");

module.exports = { getLogger, appLogger };
