import pinoHttp from "pino-http";
import logger from "../utils/logger";

export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore(req) {
      // Skip logging health checks to reduce noise
      return req.url === "/health" || req.url === "/api/health";
    },
  },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) {
      return "error";
    }
    if (res.statusCode >= 400) {
      return "warn";
    }
    return "info";
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
