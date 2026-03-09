import { Router } from 'express';
import { intelligenceController } from './intelligence-controller';

const router = Router();

router.get('/insights', intelligenceController.getInsights);

export default router;
