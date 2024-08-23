import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const currentDir = __dirname;
const testDir = path.resolve(currentDir, '..');
const rootDir = path.resolve(testDir, '..');
const loggingDir = path.resolve(rootDir, 'test-results/logging');

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} | ${level} |> ${message}`;
});

const getLogger = (infoLogFileName: string, errorLogFileName: string) =>
	winston.createLogger({
		format: winston.format.combine(
			winston.format.timestamp({ format: () => new Date().toISOString() }),
			customFormat
		),
		transports: [
			new winston.transports.Console({ level: 'debug' }),
			new winston.transports.File({
				filename: path.join(loggingDir, infoLogFileName),
				level: 'info'
			}),
			new winston.transports.File({
				filename: path.join(loggingDir, errorLogFileName),
				level: 'error'
			})
		]
	});

export default getLogger;
