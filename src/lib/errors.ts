export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const NotFound = (m = 'Resource not found') => new AppError(404, 'NOT_FOUND', m);
export const Forbidden = (m = 'Insufficient permissions') => new AppError(403, 'FORBIDDEN', m);
export const Unauthorized = (m = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', m);
export const BadRequest = (m = 'Invalid request parameters') => new AppError(400, 'BAD_REQUEST', m);
