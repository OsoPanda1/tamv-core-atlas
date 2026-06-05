import { config } from '../config.js';
import { reconcilePids, ReconciliationReport } from '../pidReconciler.js';

/**
 * Exit codes for the process
 */
enum ExitCode {
  SUCCESS = 0,
  VALIDATION_FAILED = 1,
  RUNTIME_ERROR = 2,
  TIMEOUT = 3,
  RETRY_EXHAUSTED = 4,
}

/**
 * Log levels for structured logging
 */
type LogLevel = 'info' | 'error' | 'warn' | 'debug';

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  payload?: unknown;
}

/**
 * Normalized error for logging
 */
interface NormalizedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

/**
 * Alert payload sent to monitoring/observability system
 */
interface AlertPayload {
  severity: 'critical' | 'error' | 'warning' | 'info';
  source: 'pid-reconciliation-job';
  code: string;
  message: string;
  context?: unknown;
}

/**
 * Secondary restart / retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Timeout configuration
 */
const RECONCILIATION_TIMEOUT_MS = 30_000; // 30s, ajustable según tu SLA
const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 2_000,
  maxDelayMs: 30_000,
};

const EXIT = ExitCode;

/**
 * Structured logger (puedes reemplazar internamente por Pino u otro)
 */
const emit = (level: LogLevel, message: string, payload?: unknown): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(payload !== undefined && { payload }),
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
};

/**
 * Normaliza cualquier error a una forma serializable
 */
const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      stack: error.stack,
    };
  }

  return {
    name: 'NonErrorThrowable',
    message: 'Thrown value is not an Error instance',
    cause: error,
  };
};

/**
 * Envía una alerta al sistema de paneles/observabilidad.
 * Aquí solo se loguea como 'error', pero la función está aislada
 * para conectar con Prometheus, Sentry, Loki, etc.
 */
const sendAlert = async (alert: AlertPayload): Promise<void> => {
  emit('error', 'ALERT_EMIT', alert);
  // Ejemplo de integración futura:
  // await fetch(process.env.ALERT_ENDPOINT!, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(alert),
  // });
};

/**
 * Asigna exitCode de forma centralizada
 */
const setExitCode = (code: ExitCode): void => {
  process.exitCode = code;
};

/**
 * Ejecuta una promesa con timeout duro.
 * Si se excede, rechaza con Error('Operation timed out').
 */
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = 'operation',
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(`Timeout: ${label} exceeded ${timeoutMs}ms`);
      reject(error);
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Calcula backoff exponencial con jitter para el protocolo de rearranque secundario.
 * [web:7][web:10]
 */
const computeBackoffDelay = (
  attempt: number,
  config: RetryConfig,
): number => {
  const exp = Math.min(attempt, 10);
  const base = config.baseDelayMs * 2 ** (exp - 1);
  const capped = Math.min(base, config.maxDelayMs);
  const jitter = Math.random() * 0.4 + 0.8; // 0.8x–1.2x
  return Math.round(capped * jitter);
};

/**
 * Protocolo de rearranque secundario: reintenta la reconciliación con backoff
 * ante fallos transitorios. No reintenta si se considera fallo permanente
 * (por ejemplo, error de validación de datos) — esto lo decides según `report`.
 */
const runReconciliationWithRetry = async (): Promise<ReconciliationReport> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt += 1) {
    const context = { attempt, maxAttempts: RETRY_CONFIG.maxAttempts };

    emit('info', 'PID reconciliation attempt started', context);

    try {
      const report = await withTimeout(
        reconcilePids(config),
        RECONCILIATION_TIMEOUT_MS,
        `PID reconciliation attempt ${attempt}`,
      );

      emit('info', 'PID reconciliation attempt completed', {
        ...context,
        report,
      });

      // Decisión de éxito/fallo según el propio reporte
      if (report.passed) {
        setExitCode(EXIT.SUCCESS);
        return report;
      }

      // Si el reporte indica fallo de validación, podemos no reintentar.
      // Ajusta esta heurística según el contenido de `report`.
      emit('warn', 'PID reconciliation validation failed', {
        ...context,
        report,
      });
      setExitCode(EXIT.VALIDATION_FAILED);
      return report;
    } catch (error) {
      lastError = error;
      const normalized = normalizeError(error);

      emit('error', 'PID reconciliation attempt failed', {
        ...context,
        error: normalized,
      });

      // Timeout explícito: marcamos código específico y no reintentamos más
      if (normalized.message.includes('Timeout:')) {
        await sendAlert({
          severity: 'critical',
          source: 'pid-reconciliation-job',
          code: 'PID_RECONCILIATION_TIMEOUT',
          message: normalized.message,
          context,
        });
        setExitCode(EXIT.TIMEOUT);
        throw error;
      }

      // Si todavía hay intentos restantes, aplicamos backoff
      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = computeBackoffDelay(attempt, RETRY_CONFIG);
        emit('warn', 'Scheduling PID reconciliation retry', {
          ...context,
          delayMs: delay,
        });

        await sendAlert({
          severity: 'error',
          source: 'pid-reconciliation-job',
          code: 'PID_RECONCILIATION_RETRY',
          message: 'PID reconciliation failed, scheduling retry',
          context: { ...context, delayMs: delay, error: normalized },
        });

        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // Si agotamos los intentos:
  const normalized = normalizeError(lastError);
  await sendAlert({
    severity: 'critical',
    source: 'pid-reconciliation-job',
    code: 'PID_RECONCILIATION_RETRY_EXHAUSTED',
    message: 'PID reconciliation exhausted all retry attempts',
    context: { error: normalized, ...RETRY_CONFIG },
  });

  setExitCode(EXIT.RETRY_EXHAUSTED);
  throw lastError ?? new Error('PID reconciliation failed with no error detail');
};

/**
 * Entrada principal del job, con protocolo de rearranque secundario,
 * timeout y alertas integradas.
 */
async function main(): Promise<void> {
  emit('info', 'PID reconciliation job started');

  try {
    await runReconciliationWithRetry();
  } catch (error) {
    const normalized = normalizeError(error);

    emit('error', 'PID reconciliation job failed', normalized);

    // Si nadie puso exitCode (caso raro), marcamos como runtime genérico
    if (process.exitCode === undefined) {
      setExitCode(EXIT.RUNTIME_ERROR);
    }
  } finally {
    // Fallback defensivo: si nada seteó exitCode, consideramos fallo
    if (process.exitCode === undefined) {
      setExitCode(EXIT.RUNTIME_ERROR);
    }

    emit('info', 'PID reconciliation job finished', {
      exitCode: process.exitCode,
    });
  }
}

main();
