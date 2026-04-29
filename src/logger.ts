import winston from "winston";
import { config } from "./config.js";

const isStdio = config.transport === "stdio";

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Stream({
      stream: process.stderr,
      silent: false,
    }),
  ],
  silent: isStdio && config.nodeEnv === "production" && config.logLevel === "info",
});

if (config.nodeEnv === "development" || config.logLevel === "debug") {
  logger.format = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );
}
