import { Request, Response } from 'express';
import { Session } from '../models/Session';
import { CloudinaryService } from '../services/cloudinary.service';
import { ImageCompositionService } from '../services/imageComposition.service';
import { EmailService } from '../services/email.service';
import { SmsService } from '../services/sms.service';
import { nanoid } from 'nanoid';
import { config } from '../config';

export class SessionController {
  /**
   * Create a new photobooth session
   * POST /api/sessions
   */
  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.body;

      const session = new Session({
        eventId: eventId || null,
      });

      await session.save();

      res.status(201).json({
        sessionId: session._id.toString(),
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  /**
   * Get upload signature for Cloudinary
   * GET /api/sessions/:sessionId/upload-signature
   */
  static async getUploadSignature(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      // Verify session exists
      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const timestamp = Math.round(Date.now() / 1000);
      const { signature } = CloudinaryService.generateUploadSignature(timestamp);

      res.json({
        signature,
        timestamp,
        cloudName: config.cloudinary.cloudName,
        apiKey: config.cloudinary.apiKey,
        folder: config.cloudinary.folder,
      });
    } catch (error) {
      console.error('Error generating upload signature:', error);
      res.status(500).json({ error: 'Failed to generate upload signature' });
    }
  }

  /**
   * Store photo public IDs after client uploads to Cloudinary
   * POST /api/sessions/:sessionId/photos
   */
  static async storePhotos(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { photoPublicIds } = req.body;

      if (!Array.isArray(photoPublicIds) || photoPublicIds.length !== 3) {
        res.status(400).json({ error: 'Exactly 3 photo public IDs are required' });
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      session.photoPublicIds = photoPublicIds;
      await session.save();

      res.json({ success: true });
    } catch (error) {
      console.error('Error storing photos:', error);
      res.status(500).json({ error: 'Failed to store photos' });
    }
  }

  /**
   * Complete the session by generating the final reel
   * POST /api/sessions/:sessionId/complete
   */
  static async completeSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.photoPublicIds.length !== 3) {
        res.status(400).json({ error: 'Session must have exactly 3 photos' });
        return;
      }

      // Generate the photo reel using Cloudinary transformations
      let reelData;
      try {
        // Try Cloudinary transformations first
        reelData = await CloudinaryService.createPhotoReel(session.photoPublicIds);
      } catch (error) {
        console.warn('Cloudinary transformation failed, falling back to Sharp:', error);
        // Fallback to Sharp if Cloudinary transformations fail
        reelData = await ImageCompositionService.createPhotoReelWithSharp(session.photoPublicIds);
      }

      // Generate a unique slug
      const slug = nanoid(8);
      const downloadUrl = `${config.basePublicUrl}/r/${slug}`;

      // Update session
      session.finalReelPublicId = reelData.publicId;
      session.slug = slug;
      session.downloadUrl = downloadUrl;
      await session.save();

      res.json({
        downloadUrl,
        finalReelUrl: reelData.url,
      });
    } catch (error) {
      console.error('Error completing session:', error);
      res.status(500).json({ error: 'Failed to complete session' });
    }
  }

  /**
   * Share the photo reel via email and/or SMS
   * POST /api/sessions/:sessionId/share
   */
  static async shareSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { email, phone } = req.body;

      if (!email && !phone) {
        res.status(400).json({ error: 'Email or phone number is required' });
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (!session.downloadUrl) {
        res.status(400).json({ error: 'Session not completed yet' });
        return;
      }

      const results: { email?: string; sms?: string } = {};

      // Send email if provided
      if (email) {
        try {
          await EmailService.sendDownloadLink(email, session.downloadUrl);
          results.email = 'sent';
          session.email = email;
        } catch (error) {
          console.error('Email send failed:', error);
          results.email = 'failed';
        }
      }

      // Send SMS if provided
      if (phone) {
        try {
          await SmsService.sendDownloadLink(phone, session.downloadUrl);
          results.sms = 'sent';
          session.phone = phone;
        } catch (error) {
          console.error('SMS send failed:', error);
          results.sms = 'failed';
        }
      }

      await session.save();

      res.json({
        ok: true,
        results,
      });
    } catch (error) {
      console.error('Error sharing session:', error);
      res.status(500).json({ error: 'Failed to share session' });
    }
  }

  /**
   * Get public download page
   * GET /r/:slug
   */
  static async getDownloadPage(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const session = await Session.findOne({ slug });
      if (!session || !session.finalReelPublicId) {
        res.status(404).send('<h1>Photo not found</h1>');
        return;
      }

      const imageUrl = CloudinaryService.getUrl(session.finalReelPublicId);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PhotoBooth Photos</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      width: 100%;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .image-container {
      padding: 40px;
      text-align: center;
      background: #f8f9fa;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .actions {
      padding: 30px 40px;
      text-align: center;
    }
    .download-btn {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 1.2rem;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .footer {
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 0.9rem;
    }
    @media (max-width: 600px) {
      .header h1 {
        font-size: 1.5rem;
      }
      .header p {
        font-size: 1rem;
      }
      .image-container {
        padding: 20px;
      }
      .actions {
        padding: 20px;
      }
      .download-btn {
        padding: 12px 30px;
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📸 Your PhotoBooth Photos!</h1>
      <p>Thanks for using our photobooth!</p>
    </div>
    <div class="image-container">
      <img src="${imageUrl}" alt="Your photobooth photos" />
    </div>
    <div class="actions">
      <a href="${imageUrl}" download="photobooth-${slug}.jpg" class="download-btn">
        Download Photos
      </a>
    </div>
    <div class="footer">
      <p>Powered by PhotoBooth Pro</p>
    </div>
  </div>
</body>
</html>
      `;

      res.send(html);
    } catch (error) {
      console.error('Error serving download page:', error);
      res.status(500).send('<h1>Error loading photo</h1>');
    }
  }
}
