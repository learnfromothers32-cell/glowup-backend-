import { Router } from 'express';
import { appConfig } from '../config/app';

const router = Router();

router.get('/public', (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    data: { maxUploadSizeMB: appConfig.maxUploadSizeMB }
  });
});

export default router;
