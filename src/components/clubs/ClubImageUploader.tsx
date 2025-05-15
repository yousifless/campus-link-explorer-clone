import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Define proper types for club resources/images
interface ClubResource {
  id: string;
  club_id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  created_by: string;
  created_at: string;
}

interface ClubImageUploaderProps {
  clubId: string;
  onImageUploaded?: (imageUrl: string) => void;
  type?: 'logo' | 'banner' | 'resource';
  existingImage?: string;
  className?: string;
}

const ClubImageUploader = ({
  clubId,
  onImageUploaded,
  type = 'resource',
  existingImage,
  className = ''
}: ClubImageUploaderProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(existingImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageResources, setImageResources] = useState<ClubResource[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (existingImage) {
      setImageUrl(existingImage);
    }
  }, [existingImage]);

  useEffect(() => {
    if (clubId && type === 'resource') {
      fetchImageResources();
    }
  }, [clubId, type]);

  const fetchImageResources = async () => {
    try {
      // Use club_resources instead of club_images
      const { data, error } = await supabase
        .from('club_resources')
        .select('*')
        .eq('club_id', clubId)
        .eq('type', 'image');

      if (error) {
        throw error;
      }

      if (data) {
        setImageResources(data as ClubResource[]);
      }
    } catch (error) {
      console.error('Error fetching club image resources:', error);
    }
  };

  const uploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to upload images',
        variant: 'destructive',
      });
      return;
    }

    if (!clubId) {
      toast({
        title: 'Error',
        description: 'Club ID is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Validate file type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!fileExt || !validTypes.includes(fileExt)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (jpg, jpeg, png, gif, webp)',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size should be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${clubId}/${type}-${timestamp}.${fileExt}`;
      const filePath = `club-images/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('club-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('club-images')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      setImageUrl(imageUrl);

      // Update club with new image URL if it's a logo or banner
      if (type === 'logo' || type === 'banner') {
        const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
        const { error: updateError } = await supabase
          .from('clubs')
          .update({ [updateField]: imageUrl })
          .eq('id', clubId);

        if (updateError) throw updateError;
      } 
      // Store as a club resource if it's a resource type
      else if (type === 'resource') {
        const { error: resourceError } = await supabase
          .from('club_resources')
          .insert({
            club_id: clubId,
            title: `Image ${timestamp}`, // Required field
            url: imageUrl,
            type: 'image',
            created_by: user.id
          });

        if (resourceError) throw resourceError;
        
        // Refresh the resources list
        fetchImageResources();
      }

      if (onImageUploaded) {
        onImageUploaded(imageUrl);
      }

      toast({
        title: 'Upload successful',
        description: 'Your image has been uploaded',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImage(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      // Use club_resources instead of club_images
      const { error } = await supabase
        .from('club_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      // Refresh the list
      fetchImageResources();

      toast({
        title: 'Image deleted',
        description: 'The image has been removed',
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete the image',
        variant: 'destructive',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium">Click or drag image to upload</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
          </div>
        )}
      </div>

      {/* Preview for logo/banner types */}
      {(type === 'logo' || type === 'banner') && imageUrl && (
        <div className="mt-4 relative">
          <div className="rounded-lg overflow-hidden border">
            <img
              src={imageUrl}
              alt={`Club ${type}`}
              className={`w-full ${type === 'logo' ? 'max-h-40 object-contain' : 'object-cover'}`}
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
            onClick={() => {
              setImageUrl(null);
              if (onImageUploaded) onImageUploaded('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Gallery for resource type */}
      {type === 'resource' && imageResources.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageResources.map((resource) => (
            <div key={resource.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <img
                  src={resource.url}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteResource(resource.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubImageUploader;
