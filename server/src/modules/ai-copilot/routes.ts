import { Router } from 'express';
import { aiController } from './controller';

const router = Router();

router.post('/chat', aiController.chat);

export default router;
