import { createLogger } from "../config/logger";
import { env } from "../config/env";

const logger = createLogger(env.NODE_ENV, env.LOG_LEVEL);

export { logger };
export default logger;
