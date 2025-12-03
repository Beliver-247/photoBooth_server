# Server README

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Then start the server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm test` - Run tests (not implemented yet)

## Environment Variables

See `.env.example` for all required environment variables.

### Required Services

1. **MongoDB Atlas**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string
   - Add to `MONGODB_URI`

2. **Cloudinary**
   - Sign up at https://cloudinary.com
   - Get cloud name, API key, and secret from dashboard
   - Create an unsigned upload preset:
     - Go to Settings → Upload
     - Add upload preset
     - Set signing mode to "Unsigned"
     - Set folder to "photobooth"
     - Save preset name to `CLOUDINARY_UPLOAD_PRESET`

3. **SendGrid (Optional)**
   - Sign up at https://sendgrid.com
   - Create an API key
   - Verify sender email
   - Add credentials to `.env`

4. **Twilio (Optional)**
   - Sign up at https://twilio.com
   - Get Account SID and Auth Token
   - Get a phone number
   - Add credentials to `.env`

## API Documentation

### Create Session
```http
POST /api/sessions
Content-Type: application/json

{
  "eventId": "optional-event-id"
}

Response:
{
  "sessionId": "64abc123..."
}
```

### Get Upload Signature
```http
GET /api/sessions/:sessionId/upload-signature

Response:
{
  "signature": "abc123...",
  "timestamp": 1234567890,
  "cloudName": "your-cloud",
  "apiKey": "123456789",
  "folder": "photobooth",
  "uploadPreset": "photobooth_preset"
}
```

### Store Photos
```http
POST /api/sessions/:sessionId/photos
Content-Type: application/json

{
  "photoPublicIds": ["photo1_id", "photo2_id", "photo3_id"]
}

Response:
{
  "success": true
}
```

### Complete Session
```http
POST /api/sessions/:sessionId/complete

Response:
{
  "downloadUrl": "https://yourserver.com/r/abc123",
  "finalReelUrl": "https://res.cloudinary.com/..."
}
```

### Share Session
```http
POST /api/sessions/:sessionId/share
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+1234567890"
}

Response:
{
  "ok": true,
  "results": {
    "email": "sent",
    "sms": "sent"
  }
}
```

## Deployment

### Deploy to Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy!

### Health Check

The server provides a `/health` endpoint for monitoring:

```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-02T10:30:00.000Z"
}
```

## Troubleshooting

### MongoDB Connection Issues
- Check connection string format
- Ensure IP is whitelisted in MongoDB Atlas
- Verify credentials

### Cloudinary Upload Failures
- Verify upload preset is unsigned
- Check folder permissions
- Ensure API credentials are correct

### Email/SMS Not Sending
- Verify service credentials
- Check API key permissions
- Review service dashboard for errors
