import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper function to upload image buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - Image buffer from Multer
 * @param {String} folderName - Target folder on Cloudinary
 * @returns {Promise<Object>} Upload result containing secure_url and public_id
 */
export const uploadToCloudinary = (fileBuffer, folderName = 'youthfashion/products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
