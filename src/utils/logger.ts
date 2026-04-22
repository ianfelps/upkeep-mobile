/* eslint-disable no-console */
type LogMeta = Record<string, unknown> | undefined;

function fmt(level: string, message: string, meta?: LogMeta): string {
  const ts = new Date().toISOString();
  const extra = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] ${level} ${message}${extra}`;
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    if (__DEV__) console.log(fmt('DEBUG', message, meta));
  },
  info(message: string, meta?: LogMeta) {
    if (__DEV__) console.log(fmt('INFO', message, meta));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(fmt('WARN', message, meta));
  },
  error(message: string, meta?: LogMeta) {
    console.error(fmt('ERROR', message, meta));
  },
};
