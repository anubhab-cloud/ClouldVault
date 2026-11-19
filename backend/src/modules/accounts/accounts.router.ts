import { Router } from 'express';
import { authGuard } from '../../middleware/authGuard.js';
import { AccountsController } from './accounts.controller.js';

export const accountsRouter = Router();

accountsRouter.get('/accounts', authGuard, AccountsController.list);
accountsRouter.post('/accounts/google/authorize', authGuard, AccountsController.authorizeGoogle);
accountsRouter.get('/accounts/google/callback', AccountsController.googleCallback);
accountsRouter.delete('/accounts/:accountId', authGuard, AccountsController.disconnect);
