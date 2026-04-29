import pRetry, { AbortError } from "p-retry";
import { logger } from "../logger.js";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function isRetryableError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;

  const status =
    (e["response"] as Record<string, unknown> | undefined)?.["status"] ??
    e["status"] ??
    e["code"];

  if (typeof status === "number") return RETRYABLE_STATUSES.has(status);

  // Node network errors
  const code = e["code"];
  if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND") return true;

  return false;
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  methodName: string,
  maxRetries = 3
): Promise<T> {
  return pRetry(
    async (attemptNumber) => {
      try {
        return await fn();
      } catch (err) {
        if (!isRetryableError(err)) {
          throw new AbortError(err instanceof Error ? err : new Error(String(err)));
        }
        if (attemptNumber <= maxRetries) {
          logger.warn(`${methodName} retry ${attemptNumber}/${maxRetries}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
        throw err;
      }
    },
    {
      retries: maxRetries,
      factor: 2,
      minTimeout: 1_000,
      maxTimeout: 30_000,
      randomize: true,
    }
  );
}
