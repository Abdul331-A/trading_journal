import { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { destroyAssets, uploadImage } from '../services/upload.service';

export const uploadScreenshot = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No image sent');
  res.status(201).json(await uploadImage(req.file.buffer, req.userId));
});

export const deleteScreenshot = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.body as { publicId?: string };
  if (!publicId?.startsWith(`trade-journal/${req.userId}/`)) throw ApiError.badRequest('Invalid asset');
  await destroyAssets([publicId]);
  res.json({ ok: true });
});
