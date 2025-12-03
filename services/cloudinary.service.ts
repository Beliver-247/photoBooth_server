import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export class CloudinaryService {
  /**
   * Generate a signature for secure client-side uploads
   */
  static generateUploadSignature(timestamp: number): { signature: string; timestamp: number } {
    const params = {
      timestamp,
      folder: config.cloudinary.folder,
    };
    
    const signature = cloudinary.utils.api_sign_request(
      params,
      config.cloudinary.apiSecret
    );

    return { signature, timestamp };
  }

  /**
   * Upload image buffer to Cloudinary
   */
  static async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: config.cloudinary.folder,
          public_id: filename,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.public_id);
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Create a vertical photostrip from 3 images using Cloudinary transformations
   * This creates a single composite image with 3 photos stacked vertically
   */
  static async createPhotoReel(photoPublicIds: string[]): Promise<{ publicId: string; url: string }> {
    if (photoPublicIds.length !== 3) {
      throw new Error('Exactly 3 photos are required for the reel');
    }

    // Define the dimensions for the final reel
    const photoWidth = 800;
    const photoHeight = 600;
    const margin = 40;
    const finalWidth = photoWidth + margin * 2;
    const finalHeight = photoHeight * 3 + margin * 4;

    // Use the first image as the base
    const basePublicId = photoPublicIds[0];
    
    // Build the transformation that will:
    // 1. Resize first image and add to white canvas
    // 2. Overlay the other 2 photos at different positions
    const transformation = [
      // Create white canvas and place first image
      { 
        width: finalWidth, 
        height: finalHeight, 
        crop: 'lpad', 
        background: 'white',
        gravity: 'north',
        y: margin,
      },
      // Resize the base image (first photo)
      {
        width: photoWidth,
        height: photoHeight,
        crop: 'fill',
      },
      // Overlay second photo
      {
        overlay: photoPublicIds[1].replace(/\//g, ':'),
        width: photoWidth,
        height: photoHeight,
        crop: 'fill',
        gravity: 'north',
        y: photoHeight + margin * 2,
      },
      // Overlay third photo
      {
        overlay: photoPublicIds[2].replace(/\//g, ':'),
        width: photoWidth,
        height: photoHeight,
        crop: 'fill',
        gravity: 'north',
        y: photoHeight * 2 + margin * 3,
      },
    ];

    // Generate transformation URL (no upload needed, on-the-fly transformation)
    const reelUrl = cloudinary.url(basePublicId, {
      transformation,
      secure: true,
      format: 'jpg',
    });

    // For the publicId, we'll use a reference to the base with transformation marker
    const reelPublicId = `${basePublicId}_reel`;

    return {
      publicId: reelPublicId,
      url: reelUrl,
    };
  }

  /**
   * Get the URL for a Cloudinary asset
   */
  static getUrl(publicId: string): string {
    return cloudinary.url(publicId, { secure: true });
  }
}
