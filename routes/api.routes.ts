import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';

const router = Router();

// Create a new session
router.post('/sessions', SessionController.createSession);

// Get upload signature for Cloudinary
router.get('/sessions/:sessionId/upload-signature', SessionController.getUploadSignature);

// Store photo public IDs
router.post('/sessions/:sessionId/photos', SessionController.storePhotos);

// Complete session and generate reel
router.post('/sessions/:sessionId/complete', SessionController.completeSession);

// Share session via email/SMS
router.post('/sessions/:sessionId/share', SessionController.shareSession);

export default router;
