import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error Handler] Caught exception on ${req.method} ${req.url}:`, err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';
  
  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  });
}
