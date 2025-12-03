import twilio from 'twilio';
import { config } from '../config';

let twilioClient: twilio.Twilio | null = null;

if (config.twilio.accountSid && config.twilio.authToken) {
  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
}

export class SmsService {
  static async sendDownloadLink(phone: string, downloadUrl: string): Promise<void> {
    if (!twilioClient) {
      console.warn('Twilio not configured, skipping SMS send');
      return;
    }

    const message = `📸 Your PhotoBooth photos are ready! Download them here: ${downloadUrl}`;

    try {
      await twilioClient.messages.create({
        body: message,
        from: config.twilio.fromNumber,
        to: phone,
      });
      console.log(`✅ SMS sent to ${phone}`);
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      throw error;
    }
  }
}
