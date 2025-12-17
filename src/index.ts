import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';
import util from 'util';


interface MiddlewareOptions {
    output?: 'json' | 'text';
}
interface AppContext {
    requestId: string;
    outputFormat: 'json' | 'text';
}
export const als = new AsyncLocalStorage<AppContext>();
export function initLogger(options: MiddlewareOptions = {}) {
    const defaultOutput = options.output || 'text';
    return function contextMiddleware(req: any, res: any, next: any) {
      const requestId = uuidv4();
      als.run({ requestId, outputFormat: defaultOutput }, () => next());
    };
}

const colorCodes: Record<string, string> = {
  error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[32m', http: '\x1b[35m',
  verbose: '\x1b[36m', debug: '\x1b[34m', silly: '\x1b[90m', reset: '\x1b[0m'
};
const getColor = (level: string): string => colorCodes[level.toLowerCase()] || '';

/**
 * Función de log principal, ahora acepta metadatos explícitamente.
 * @param level Nivel del log (INFO, DEBUG, etc.)
 * @param meta Objeto con metadatos como el nombre del archivo.
 * @param args El resto de los argumentos del mensaje.
 */
const log = (level: string, meta: Record<string, any>, ...args: any[]): void => {
  const store = als.getStore();
  const timestamp = new Date().toISOString();
  // Fix 1 & 2: Use util.inspect to avoid circular dependency crashes and handle objects better
  const message = (args || []).map( a => ((typeof a == "object") ? util.inspect(a) : a)).join(" ");

  const formattedTimestamp = formatFullDate(); // Asumimos que esta función sigue existiendo
  const color = getColor(level);
  const metaStr = (() => {
    // Fix 3: Check keys length instead of truthiness of the first value to support values like 0 or false
    if (Object.keys(meta).length === 0) return '';
    if( Object.keys(meta).length == 1 &&  Object.keys(meta).at(0) == "str") return `<${meta.str}> `;
    return `<${Object.entries(meta).map(([key, value]) => `${key}=${value}`).join(' | ')}> `;
  })();

  // Fix 4: Use console.error for ERROR level calls
  const consoleMethod = level.toUpperCase() === 'ERROR' ? console.error : console.log;

  if (!store) {
    consoleMethod(`${color}${formattedTimestamp} ${metaStr}[${level.toUpperCase()}]: ${message}${colorCodes.reset}`);
    return;
  }

  const { requestId, outputFormat } = store;

  if (outputFormat === 'json') {
    return consoleMethod(JSON.stringify({
      timestamp,
      requestId,
      meta,
      level: level.toLowerCase(),
      message,
    }));
  }
  
  const reqIdStr = `[${requestId}]`;
  consoleMethod(`${color}${formattedTimestamp} ${reqIdStr} ${metaStr}[${level.toUpperCase()}]: ${message}${colorCodes.reset}`);
};

const formatFullDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export class Logger {
  private meta: Record<string, any>;

  constructor(record?: string | number | Record<string, any> ) {
    this.meta = {};
    if(!record) return;
    if(["string", "number"].includes(typeof record))
      this.meta = {str :record.toString()};
    else
      this.meta = record as Record<string, any>;
  }
  
  debug = (...args: any[]): void => log('DEBUG', this.meta , ...args);
  info = (...args: any[]): void => log('INFO', this.meta, ...args);
  warn = (...args: any[]): void => log('WARN', this.meta, ...args);
  error = (...args: any[]): void => log('ERROR', this.meta, ...args);
  http = (...args: any[]): void => log('HTTP', this.meta, ...args);
  verbose = (...args: any[]): void => log('VERBOSE', this.meta, ...args);
  silly = (...args: any[]): void => log('SILLY', this.meta, ...args);
}

export const logger = {
  // <-- CAMBIO CLAVE 4: Llama a log con un objeto de metadatos vacío.
  debug: (...args: any[]) => log('DEBUG', {}, ...args),
  info: (...args: any[]) => log('INFO', {}, ...args),
  warn: (...args: any[]) => log('WARN', {}, ...args),
  error: (...args: any[]) => log('ERROR', {}, ...args),
  http: (...args: any[]) => log('HTTP', {}, ...args),
  verbose: (...args: any[]) => log('VERBOSE', {}, ...args),
  silly: (...args: any[]) => log('SILLY', {}, ...args)
};