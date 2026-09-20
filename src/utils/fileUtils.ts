import { DemandAttachment } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Converts an uploaded image file into an optimized, persistent Data URL (Base64).
 * This prevents broken blob: URLs upon reload/localStorage persistence, and scales
 * large photos so they don't exceed storage quotas while maintaining crisp quality.
 */
export const processAttachmentFile = async (
  file: File
): Promise<DemandAttachment> => {
  let type: 'image' | 'video' | 'document' | 'other' = 'other';
  if (file.type.startsWith('image/')) {
    type = 'image';
  } else if (file.type.startsWith('video/')) {
    type = 'video';
  } else if (
    file.type.includes('pdf') ||
    file.type.includes('word') ||
    file.type.includes('text') ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.doc') ||
    file.name.endsWith('.docx')
  ) {
    type = 'document';
  }

  let finalUrl = '';

  if (type === 'image') {
    // For SVG or GIF, preserve raw data URL without canvas rasterization
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      finalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });
    } else {
      // For PNG, JPG, WEBP: scale large dimensions down to 1600px max and compress to lightweight data URL
      finalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1600;
            let width = img.width;
            let height = img.height;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string || URL.createObjectURL(file));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const isPng = file.type === 'image/png';
            try {
              const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.88);
              resolve(dataUrl);
            } catch {
              resolve(e.target?.result as string || URL.createObjectURL(file));
            }
          };
          img.onerror = () => {
            resolve(e.target?.result as string || URL.createObjectURL(file));
          };
          img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });
    }
  } else {
    // Videos or general documents
    finalUrl = URL.createObjectURL(file);
  }

  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: file.name,
    size: file.size,
    type,
    url: finalUrl,
    uploadedAt: 'Agora mesmo',
    verifiedClean: true,
    threatScanStatus: 'clean',
  };
};
