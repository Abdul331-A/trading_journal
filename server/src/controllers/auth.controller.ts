import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { User } from '../models/User';
import { Account } from '../models/Account';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

const sign = (id: string) =>
  jwt.sign({ sub: id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const publicUser = (u: { _id: unknown; name: string; email: string }) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict('Email already registered');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await Account.create({ user: user._id, name: 'My Account', isDefault: true });
  res.status(201).json({ token: sign(String(user._id)), user: publicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Wrong email or password');
  }
  res.json({ token: sign(String(user._id)), user: publicUser(user) });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) throw ApiError.unauthorized();
  res.json({ user: publicUser(user) });
});
