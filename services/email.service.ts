import sgMail from '@sendgrid/mail';
import { config } from '../config';

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export class EmailService {
  static async sendDownloadLink(email: string, downloadUrl: string): Promise<void> {
    if (!config.sendgrid.apiKey) {
      console.warn('SendGrid API key not configured, skipping email send');
      return;
    }

    const msg = {
      to: email,
      from: config.sendgrid.fromEmail,
      subject: 'Your PhotoBooth Photos!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your PhotoBooth Photos Are Ready! 📸</h1>
          <p style="font-size: 16px; color: #555;">
            Thanks for using our photobooth! Your photos are ready to download.
          </p>
          <div style="margin: 30px 0;">
            <a href="${downloadUrl}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 18px; display: inline-block;">
              Download Your Photos
            </a>
          </div>
          <p style="font-size: 14px; color: #777;">
            Or copy this link: <a href="${downloadUrl}">${downloadUrl}</a>
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 40px;">
            This link will be available for a limited time. Download your photos soon!
          </p>
        </div>
      `,
      text: `Your PhotoBooth photos are ready! Download them here: ${downloadUrl}`,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }
}
