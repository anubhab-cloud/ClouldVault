import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../../middleware/authGuard.js';
import { validate } from '../../middleware/validate.js';
import { AlbumsController } from './albums.controller.js';

export const albumsRouter = Router();

const createAlbumSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Album title is required').max(100),
    description: z.string().max(500).optional(),
  }),
});

const updateAlbumSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

const addPhotoSchema = z.object({
  body: z.object({
    photoId: z.string().uuid('Valid photoId UUID required'),
  }),
});

albumsRouter.get('/albums', authGuard, AlbumsController.list);
albumsRouter.post('/albums', authGuard, validate(createAlbumSchema), AlbumsController.create);
albumsRouter.get('/albums/:albumId', authGuard, AlbumsController.getById);
albumsRouter.patch('/albums/:albumId', authGuard, validate(updateAlbumSchema), AlbumsController.update);
albumsRouter.delete('/albums/:albumId', authGuard, AlbumsController.delete);

albumsRouter.post('/albums/:albumId/photos', authGuard, validate(addPhotoSchema), AlbumsController.addPhoto);
albumsRouter.delete('/albums/:albumId/photos/:photoId', authGuard, AlbumsController.removePhoto);
