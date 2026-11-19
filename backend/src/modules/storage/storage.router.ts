import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard.js';
import { StorageController } from './storage.controller.js';

export const storageRouter = Router();

storageRouter.get('/storage/summary', authGuard, StorageController.getSummary);
storageRouter.get('/storage/accounts/:accountId', authGuard, StorageController.getAccountStorage);
