import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { log } from './index';

const blockedIPs = new Map<string, { blockedUntil: number; strikes: number }>();
const STRIKE_THRESHOLD = 5;
const BLOCK_DURATION_MS = 30 * 60 * 1000;
const STRIKE_DECAY_MS = 5 * 60 * 1000;

function getClientIP(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
}

function addStrike(ip: string): boolean {
  const now = Date.now();
  const record = blockedIPs.get(ip);
  
  if (record && record.blockedUntil > now) {
    return true;
  }
  
  let strikes = 1;
  if (record && (now - record.blockedUntil) < STRIKE_DECAY_MS) {
    strikes = record.strikes + 1;
  }
  
  if (strikes >= STRIKE_THRESHOLD) {
    blockedIPs.set(ip, { blockedUntil: now + BLOCK_DURATION_MS, strikes });
    log(`IP ${ip} blocked for ${BLOCK_DURATION_MS / 60000} minutes due to ${strikes} rate limit violations`, 'security');
    return true;
  }
  
  blockedIPs.set(ip, { blockedUntil: now, strikes });
  return false;
}

export function checkBlockedIP(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  const record = blockedIPs.get(ip);
  
  if (record && record.blockedUntil > Date.now()) {
    const remainingMs = record.blockedUntil - Date.now();
    const remainingMins = Math.ceil(remainingMs / 60000);
    log(`Blocked request from IP ${ip} - ${remainingMins} minutes remaining`, 'security');
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Your access is temporarily blocked due to excessive requests. Please try again in ${remainingMins} minutes.`,
      retryAfter: Math.ceil(remainingMs / 1000),
    });
  }
  
  next();
}

const createLimiterHandler = (message: string) => (req: Request, res: Response) => {
  const ip = getClientIP(req);
  const isBlocked = addStrike(ip);
  
  if (isBlocked) {
    const record = blockedIPs.get(ip);
    const remainingMs = record ? record.blockedUntil - Date.now() : BLOCK_DURATION_MS;
    const remainingMins = Math.ceil(remainingMs / 60000);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Your access is temporarily blocked. Please try again in ${remainingMins} minutes.`,
      retryAfter: Math.ceil(remainingMs / 1000),
    });
  }
  
  log(`Rate limit exceeded for IP ${ip}`, 'security');
  return res.status(429).json({
    error: 'Too Many Requests',
    message,
    retryAfter: 60,
  });
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('You are making too many requests. Please slow down.'),
});

export const dealLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many deal attempts. Please wait before trying again.',
  handler: createLimiterHandler('Too many deal attempts. Please wait a minute before trying again.'),
});

export const ledgerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('Too many transactions. Please wait before trying again.'),
});

export const gameActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('Too many game actions. Please wait before trying again.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('Too many authentication attempts. Please try again in 15 minutes.'),
});

export const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimiterHandler('Too many purchase attempts. Please wait before trying again.'),
});

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  const entries = Array.from(blockedIPs.entries());
  entries.forEach(([ip, record]) => {
    if (record.blockedUntil < now - STRIKE_DECAY_MS) {
      blockedIPs.delete(ip);
      cleaned++;
    }
  });
  if (cleaned > 0) {
    log(`Cleaned up ${cleaned} expired IP records`, 'security');
  }
}, 5 * 60 * 1000);
