import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  logger.info('Health check pinged');
  res.status(200).json({ status: 'ok' });
});

export default router;