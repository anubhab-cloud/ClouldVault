import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard.js';
import { PhotosController } from './photos.controller.js';

export const photosRouter = Router();

photosRouter.get('/photos', authGuard, PhotosController.list);
photosRouter.get('/photos/:photoId', authGuard, PhotosController.getById);
photosRouter.delete('/photos/:photoId', authGuard, PhotosController.delete);
