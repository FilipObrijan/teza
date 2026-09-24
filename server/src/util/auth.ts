import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: 'seller' | 'distributor' | 'admin';
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
