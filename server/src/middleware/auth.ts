import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;
}

export default function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Потрібно увійти в систему' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as TokenPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Токен недійсний або прострочений' });
  }
}