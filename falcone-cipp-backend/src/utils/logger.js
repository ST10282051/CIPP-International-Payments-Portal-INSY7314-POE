import winston from "winston";

// Create a Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Stream interface for Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

export default logger;
// (GeeksForGeeks, 2025).