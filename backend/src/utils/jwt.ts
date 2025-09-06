import jwt from 'jsonwebtoken';

// Enum types for SQLite compatibility
export enum UserRole {
  GROUP = 'GROUP',
  LOCAL_SUBCOMMITTEE = 'LOCAL_SUBCOMMITTEE',
  LOCALITY = 'LOCALITY',
  REGION = 'REGION',
  ADMIN = 'ADMIN'
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret) as JWTPayload;
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: '30d',
  });
};