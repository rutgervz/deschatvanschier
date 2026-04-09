const requests = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CHAT = 10;         // 10 chat messages per minute
const MAX_GENERAL = 60;      // 60 general requests per minute

export function rateLimit(ip: string, type: 'chat' | 'general' = 'general'): { ok: boolean; remaining: number } {
  const key = `${type}:${ip}`;
  const now = Date.now();
  const max = type === 'chat' ? MAX_CHAT : MAX_GENERAL;

  const entry = requests.get(key);
  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: max - entry.count };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetAt) requests.delete(key);
  }
}, 5 * 60 * 1000);
