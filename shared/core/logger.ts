import { Logger } from 'winston';

const logger: Logger = new Logger({
  level: 'info',
  format: Logger.format.combine(
    Logger.format.timestamp(),
    Logger.format.json()
  ),
  transports: [
    new Logger.transports.Console(),
    new Logger.transports.File({ filename: 'combined.log' })
  ]
});

export default logger;