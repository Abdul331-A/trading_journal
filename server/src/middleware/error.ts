import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError';
import { isProd } from '../config/env';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound('Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message ?? 'Invalid input',
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof MulterError) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: isProd ? 'Server error' : String((err as Error)?.message ?? err) });
}
