/**
 * Simple in-memory rate limiter for API routes
 * 
 * NOTE: This is a basic implementation suitable for single-instance deployments.
 * For production at scale, consider using @upstash/ratelimit or similar.
 * 
 * The in-memory store will reset on server restart and doesn't work
 * across multiple serverless instances. However, it provides basic
 * protection against abuse for single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Default rate limit configurations for different route types
 */
export const RATE_LIMIT_CONFIGS = {
  /** Export routes: 10 requests per minute (generous for downloads) */
  export: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** Financial data provider: 30 requests per minute */
  financialData: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  /** General API routes: 60 requests per minute */
  api: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Check rate limit for a given key
 * 
 * @param key - Unique identifier for rate limiting (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  // Periodic cleanup
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has expired, start fresh
  if (!entry || now > entry.resetTime) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime: resetAt,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetTime,
  };
}

/**
 * Get rate limit key from request
 * Uses a combination of IP and user ID for better granularity
 */
export function getRateLimitKey(
  request: Request,
  userId?: string | null
): string {
  // Get IP from headers (Vercel/Cloudflare provide these)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  // Combine IP and user ID for more precise limiting
  if (userId) {
    return `rate:${userId}:${ip}`;
  }
  
  return `rate:${ip}`;
}

/**
 * Create a rate limited response
 */
export function rateLimitExceededResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Hai effettuato troppe richieste in poco tempo. Riprova tra qualche minuto.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  );
}

