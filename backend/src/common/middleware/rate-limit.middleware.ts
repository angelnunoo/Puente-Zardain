import { NextFunction, Request, Response } from 'express';

interface CounterEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, CounterEntry>();
const userLimits = new Map<string, CounterEntry>();

function getCounter(map: Map<string, CounterEntry>, key: string, windowMs: number) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    const newEntry = { count: 1, resetAt };
    map.set(key, newEntry);
    return newEntry;
  }
  entry.count += 1;
  return entry;
}

export class RateLimitMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || req.connection.remoteAddress || 'unknown';
    const ipEntry = getCounter(ipLimits, ip, 60 * 1000);
    if (ipEntry.count > 100) {
      res.status(429).json({ message: 'Too many requests from this IP' });
      return;
    }

    const authHeader = req.headers.authorization?.toString() || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const userEntry = getCounter(userLimits, token, 1000);
      if (userEntry.count > 10) {
        res.status(429).json({ message: 'Too many authenticated requests' });
        return;
      }
    }

    next();
  }
}
