import { supabase } from '@/integrations/supabase/client';

// Define the bucket name as a constant to ensure consistency
export const AVATAR_BUCKET_NAME = 'avatars';

/**
 * Resizes an image file to a more manageable size
 * @param file The file to resize
 * @param maxWidth Maximum width in pixels
 * @param maxHeight Maximum height in pixels
 * @returns A promise that resolves to the resized file
 */
export const resizeImage = async (file: File, maxWidth = 800, maxHeight = 800): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        
        const resizedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        resolve(resizedFile);
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };
  });
};

/**
 * Creates a signed URL for a file in the storage bucket
 * @param bucketName The name of the bucket
 * @param path The path to the file
 * @param expirySeconds The number of seconds until the URL expires
 * @returns A promise that resolves to the signed URL
 */
export const getSignedUrl = async (bucketName: string, path: string, expirySeconds = 3600): Promise<string | null> => {
  try {
    console.log(`Creating signed URL for ${bucketName}/${path}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expirySeconds);
    
    if (error) {
      console.error("Error creating signed URL:", error);
      throw error;
    }
    
    console.log("Signed URL created:", data.signedUrl);
    return data.signedUrl;
  } catch (e) {
    console.error("Error creating signed URL:", e);
    return null;
  }
};

/**
 * Ensures the avatar bucket exists, creating it if necessary
 * @returns A promise that resolves when the bucket is ready
 */
export const ensureAvatarBucket = async (): Promise<void> => {
  try {
    console.log('Checking if avatar bucket exists...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }
    
    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === AVATAR_BUCKET_NAME);
    console.log(`Bucket '${AVATAR_BUCKET_NAME}' exists:`, bucketExists);
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log(`Creating bucket '${AVATAR_BUCKET_NAME}'...`);
      
      const { data, error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET_NAME, {
        public: false, // Private bucket for user avatars
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
      
      console.log('Bucket created successfully:', data);
    }
  } catch (error) {
    console.error('Error ensuring avatar bucket:', error);
    throw error;
  }
};

/**
 * Uploads an avatar image to the Supabase storage bucket
 * @param file The file to upload
 * @returns The public URL of the uploaded file
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  try {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG and GIF are allowed.');
    }

    // Resize the image before upload
    console.log(`Original file size: ${file.size} bytes`);
    const resizedFile = await resizeImage(file);
    console.log(`Resized file size: ${resizedFile.size} bytes`);

    // Get current user and log details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("Upload attempt by user:", user?.id);
    console.log("User error:", userError);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("Session exists:", !!session);
    console.log("Session error:", sessionError);
    
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('No active session found');
    }
    
    const userId = user.id;
    
    // Create file path that matches the RLS policy
    // The RLS policy expects: auth.uid()::text = (storage.foldername(name))[1]
    // This means the first folder in the path must be the user ID
    // Sanitize the filename to remove special characters
    const sanitizedFileName = resizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`Attempting upload to bucket: ${AVATAR_BUCKET_NAME}, path: ${filePath}`);
    
    // Upload with explicit options
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .upload(filePath, resizedFile, {
        upsert: true,
        cacheControl: '3600'
      });
      
    if (error) {
      console.error('Upload error details:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .getPublicUrl(filePath);
      
    console.log('Public URL:', urlData.publicUrl);
    
    // Also get a signed URL as a fallback
    const signedUrl = await getSignedUrl(AVATAR_BUCKET_NAME, filePath);
    console.log('Signed URL:', signedUrl);
    
    // Save the URL to the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: urlData.publicUrl,
        avatar_signed_url: signedUrl, // Store both URLs
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating profile with avatar URL:", updateError);
      throw updateError;
    }
    
    console.log("Profile updated with new avatar URL");
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Deletes an avatar from the Supabase storage bucket
 * @param path The path of the file to delete
 */
export const deleteAvatar = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .remove([path]);
      
    if (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
    
    console.log('Avatar deleted successfully');
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
};

/**
 * Tests storage access by uploading a small test file
 * @returns The result of the test upload
 */
export const testStorageAccess = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('Testing storage access...');
    
    // Ensure the bucket exists
    await ensureAvatarBucket();
    
    // Get current session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current session:', sessionData);
    
    if (!sessionData.session) {
      return { success: false, error: { message: 'No authenticated session found' } };
    }
    
    const userId = sessionData.session.user.id;
    
    // Create a small test file
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
    
    // Try to upload with proper path structure
    const testPath = `${userId}/test-${Date.now()}.txt`;
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .upload(testPath, testFile, {
        upsert: true
      });
      
    if (error) {
      console.error('Test upload failed:', error);
      return { success: false, error };
    } else {
      console.log('Test upload succeeded:', data);
      return { success: true };
    }
  } catch (err) {
    console.error('Test error:', err);
    return { success: false, error: err };
  }
};

/**
 * Makes the avatar bucket public
 * @returns A promise that resolves when the bucket is made public
 */
export const makeBucketPublic = async (): Promise<void> => {
  try {
    console.log(`Making bucket '${AVATAR_BUCKET_NAME}' public...`);
    
    const { data, error } = await supabase.storage.updateBucket(AVATAR_BUCKET_NAME, {
      public: true
    });
    
    if (error) {
      console.error('Error making bucket public:', error);
      throw error;
    }
    
    console.log('Bucket made public successfully:', data);
  } catch (error) {
    console.error('Error making bucket public:', error);
    throw error;
  }
};

/**
 * Tests if an image URL is accessible
 * @param url The URL to test
 * @returns A promise that resolves to true if the URL is accessible
 */
export const testImageUrl = async (url: string): Promise<boolean> => {
  try {
    console.log('Testing image URL:', url);
    
    const response = await fetch(url, { method: 'HEAD' });
    console.log("Image URL test status:", response.status);
    console.log("Image URL test headers:", Object.fromEntries([...response.headers]));
    
    return response.ok;
  } catch (e) {
    console.error("Image URL test error:", e);
    return false;
  }
}; 