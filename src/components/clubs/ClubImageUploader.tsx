
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ClubImage } from '@/types/clubTypes';
import { motion } from 'framer-motion';

interface ClubImageUploaderProps {
  clubId: string;
}

type ImageType = 'banner' | 'logo' | 'gallery';

const ClubImageUploader: React.FC<ClubImageUploaderProps> = ({ clubId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ClubImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>('upload');

  useEffect(() => {
    fetchImages();
  }, [clubId]);

  const fetchImages = async () => {
    try {
      // Change this to use the correct table based on your DB schema
      // Instead of club_images, we'll use club_resources with type = 'image'
      const { data, error } = await supabase
        .from('club_resources')
        .select('*')
        .eq('club_id', clubId)
        .eq('type', 'image');

      if (error) {
        throw error;
      }

      if (data) {
        // Convert club_resources to match ClubImage interface
        const imageData: ClubImage[] = data.map(resource => ({
          id: resource.id,
          club_id: resource.club_id,
          title: resource.title,
          url: resource.url,
          type: resource.type === 'image' ? 'gallery' : resource.type,
          description: resource.description,
          created_by: resource.created_by,
          created_at: resource.created_at
        }));
        
        setImages(imageData);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error fetching images',
        description: 'Failed to load club images',
        variant: 'destructive',
      });
    }
  };

  const uploadImage = async (file: File, type: ImageType = 'gallery') => {
    if (!user) return;
    
    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${clubId}/${type}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `club-images/${fileName}`;
      
      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('public')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
      
      // Add entry to club_resources table (not club_images)
      const { error: dbError } = await supabase
        .from('club_resources')
        .insert({
          club_id: clubId,
          title: file.name, // Using filename as title
          url: publicUrl,
          type: 'image', // Store as 'image' type in club_resources
          created_by: user.id
        });
        
      if (dbError) throw dbError;
      
      // If it's a special type like banner or logo, update the club record
      if (type === 'banner' || type === 'logo') {
        const updateField = type === 'banner' ? 'banner_url' : 'logo_url';
        
        const { error: clubUpdateError } = await supabase
          .from('clubs')
          .update({ [updateField]: publicUrl })
          .eq('id', clubId);
          
        if (clubUpdateError) throw clubUpdateError;
      }
      
      toast({
        title: 'Image uploaded',
        description: 'Image has been uploaded successfully',
      });
      
      fetchImages(); // Refresh the images list
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      // First get the image to find the storage path
      const { data: imageData, error: fetchError } = await supabase
        .from('club_resources')
        .select('url')
        .eq('id', imageId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Extract file path from URL
      const urlPath = new URL(imageData.url).pathname;
      const storagePath = urlPath.split('/').slice(2).join('/'); // Remove /storage/v1/
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('public')
        .remove([storagePath]);
      
      // Delete from database even if storage delete fails
      // (storage might have already been deleted or URL might be external)
      const { error: dbError } = await supabase
        .from('club_resources')
        .delete()
        .eq('id', imageId);
        
      if (dbError) throw dbError;
      
      toast({
        title: 'Image deleted',
        description: 'Image has been deleted successfully',
      });
      
      // Update the local state
      setImages(images.filter(img => img.id !== imageId));
      
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: ImageType = 'gallery') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file, type);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="upload">Upload Images</TabsTrigger>
        <TabsTrigger value="gallery">Club Gallery</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Banner Uploader */}
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 p-6 rounded-lg mb-4 flex flex-col items-center">
                    <ImageIcon className="h-12 w-12 text-blue-500 mb-2" />
                    <h3 className="font-semibold text-lg">Club Banner</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Recommended size: 1200×300
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="banner-upload" className="cursor-pointer">
                      <div className="bg-blue-100 hover:bg-blue-200 transition-colors rounded-md py-2 px-4 text-blue-700 flex items-center justify-center">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>{uploading ? 'Uploading...' : 'Upload Banner'}</span>
                      </div>
                      <Input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'banner')}
                      />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Logo Uploader */}
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="bg-purple-50 p-6 rounded-lg mb-4 flex flex-col items-center">
                    <ImageIcon className="h-12 w-12 text-purple-500 mb-2" />
                    <h3 className="font-semibold text-lg">Club Logo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Recommended size: 400×400
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="bg-purple-100 hover:bg-purple-200 transition-colors rounded-md py-2 px-4 text-purple-700 flex items-center justify-center">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                      </div>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                      />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Gallery Image Uploader */}
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="bg-green-50 p-6 rounded-lg mb-4 flex flex-col items-center">
                    <FileText className="h-12 w-12 text-green-500 mb-2" />
                    <h3 className="font-semibold text-lg">Gallery Images</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add photos to club gallery
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="gallery-upload" className="cursor-pointer">
                      <div className="bg-green-100 hover:bg-green-200 transition-colors rounded-md py-2 px-4 text-green-700 flex items-center justify-center">
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      </div>
                      <Input
                        id="gallery-upload"
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'gallery')}
                      />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </TabsContent>
      
      <TabsContent value="gallery">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {images.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-muted-foreground">No images uploaded yet</p>
            </div>
          ) : (
            images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative group overflow-hidden rounded-lg"
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-medium truncate">{image.title}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-white/80">
                      {new Date(image.created_at || '').toLocaleDateString()}
                    </span>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => image.id && deleteImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </TabsContent>
    </Tabs>
  );
};

export default ClubImageUploader;
