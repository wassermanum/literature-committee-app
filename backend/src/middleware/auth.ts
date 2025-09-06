import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload, UserRole } from '../utils/jwt.js';

// Расширяем интерфейс Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'Invalid token',
    });
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// Middleware для проверки принадлежности к организации
export const checkOrganizationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'Authentication required',
    });
    return;
  }

  // Для админов разрешаем доступ ко всем организациям
  if (req.user.role === UserRole.ADMIN) {
    next();
    return;
  }

  // Проверяем доступ к организации через параметры запроса
  const organizationId = req.params.organizationId || req.body.organizationId;
  
  if (organizationId && organizationId !== req.user.organizationId) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access to this organization is not allowed',
    });
    return;
  }

  next();
};