import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';

const router = Router();

// Public download page
router.get('/r/:slug', SessionController.getDownloadPage);

export default router;
