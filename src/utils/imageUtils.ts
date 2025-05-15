/**
 * This file contains utility functions for image processing
 */

/**
 * Creates a cropped image from source image based on crop area
 * 
 * @param imageSrc - Source image URL
 * @param pixelCrop - Crop area in pixels {x, y, width, height}
 * @param rotation - Optional rotation in degrees
 * @param aspectRatio - Optional aspect ratio (e.g., 16/9, 1, etc)
 * @returns Promise with the cropped image as a Blob
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  aspectRatio = 1
): Promise<Blob | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set proper canvas dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Apply rotation if needed
  if (rotation) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Restore canvas if rotated
  if (rotation) {
    ctx.restore();
  }

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.95 // Image quality
    );
  });
};

/**
 * Creates an image element from a source URL
 * 
 * @param url - The image URL
 * @returns Promise with the loaded image element
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
    // Enable cross-origin usage of images
    image.crossOrigin = 'anonymous';
  });

/**
 * Format file size to a human-readable string
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Generate a placeholder color based on text
 * 
 * @param text - Input text to generate color from
 * @returns HEX color code
 */
export const getColorFromText = (text: string): string => {
  let hash = 0;
  if (text.length === 0) return '#6E56CF'; // Default color
  
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  
  const colors = [
    '#6E56CF', // Purple
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F97316', // Orange
  ];
  
  return colors[Math.abs(hash) % colors.length];
}; 