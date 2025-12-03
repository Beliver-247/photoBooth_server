import sharp from 'sharp';
import axios from 'axios';
import { CloudinaryService } from './cloudinary.service';

export class ImageCompositionService {
  /**
   * Alternative method using Sharp if Cloudinary transformations don't work
   * Downloads 3 images, composites them into a vertical strip, and re-uploads
   */
  static async createPhotoReelWithSharp(photoPublicIds: string[]): Promise<{ publicId: string; url: string }> {
    if (photoPublicIds.length !== 3) {
      throw new Error('Exactly 3 photos are required for the reel');
    }

    // Define dimensions
    const photoWidth = 800;
    const photoHeight = 600;
    const margin = 40;
    const finalWidth = photoWidth + margin * 2;
    const finalHeight = photoHeight * 3 + margin * 4;

    // Download all three images
    const imageBuffers = await Promise.all(
      photoPublicIds.map(async (publicId) => {
        const url = CloudinaryService.getUrl(publicId);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      })
    );

    // Resize each image to standard dimensions
    const resizedImages = await Promise.all(
      imageBuffers.map((buffer) =>
        sharp(buffer)
          .resize(photoWidth, photoHeight, { fit: 'cover' })
          .toBuffer()
      )
    );

    // Create the composite image
    const compositeImage = await sharp({
      create: {
        width: finalWidth,
        height: finalHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: resizedImages[0],
          top: margin,
          left: margin,
        },
        {
          input: resizedImages[1],
          top: photoHeight + margin * 2,
          left: margin,
        },
        {
          input: resizedImages[2],
          top: photoHeight * 2 + margin * 3,
          left: margin,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload the composite image back to Cloudinary
    const reelFilename = `reel_${Date.now()}`;
    const publicId = await CloudinaryService.uploadImage(compositeImage, reelFilename);
    const url = CloudinaryService.getUrl(publicId);

    return { publicId, url };
  }
}
