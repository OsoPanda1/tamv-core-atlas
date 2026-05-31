// Tiny retry/backoff wrapper around fetch with a hard timeout.
import { LIMITS } from "./config.js";

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  retries = LIMITS.httpRetries,
): Promise<Response> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LIMITS.httpTimeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`retryable http ${res.status} for ${url}`);
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const wait = LIMITS.httpBackoffMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      attempt++;
    }
  }
  throw new Error(`fetchWithRetry exhausted for ${url}: ${String(lastErr)}`);
}