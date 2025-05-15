import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { Club, ClubImage } from '@/types/clubs';
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Pencil, 
  Trash2, 
  Info, 
  FileImage
} from 'lucide-react';

// Advanced image cropping
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/imageUtils';

interface ClubImageUploaderProps {
  club: Club;
  onUpdate: (updatedClub: Partial<Club>) => Promise<any>;
  isAdmin?: boolean;
}

type ImageType = 'banner' | 'logo' | 'gallery';
type CropArea = { x: number; y: number; width: number; height: number };

const ClubImageUploader: React.FC<ClubImageUploaderProps> = ({ 
  club, 
  onUpdate,
  isAdmin = false 
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('banner');
  const [loading, setLoading] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<ClubImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<ClubImage | null>(null);
  
  // Fetch gallery images on component mount
  useEffect(() => {
    if (club.id) {
      fetchGalleryImages();
    }
  }, [club.id]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_images')
        .select('*')
        .eq('club_id', club.id)
        .eq('type', 'gallery');
        
      if (error) throw error;
      
      setGalleryImages(data as ClubImage[]);
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      toast.error('Failed to load gallery images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setSelectedImage(file);
    setPreviewUrl(url);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropCancel = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels || !previewUrl) return;
    
    try {
      setLoading(true);
      
      // Crop the image
      const croppedImageBlob = await getCroppedImg(
        previewUrl,
        croppedAreaPixels,
        0, // No rotation
        activeTab === 'logo' ? 1 : 16/9 // Aspect ratio: 1:1 for logo, 16:9 for banner/gallery
      );
      
      if (!croppedImageBlob) {
        throw new Error('Failed to crop image');
      }
      
      // Convert blob to file
      const croppedImageFile = new File(
        [croppedImageBlob], 
        selectedImage.name, 
        { type: selectedImage.type }
      );
      
      // Upload the image
      await uploadImage(croppedImageFile, activeTab as ImageType);
      
      // Reset states
      setSelectedImage(null);
      setPreviewUrl(null);
      setShowCropper(false);
      
      toast.success(`Club ${activeTab} updated successfully`);
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error('Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: ImageType) => {
    if (!user || !club.id) return;
    
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${club.id}/${type}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `club-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('club-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('club-images')
        .getPublicUrl(filePath);
        
      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      // For banner and logo, update the club record
      if (type === 'banner' || type === 'logo') {
        const updateData = type === 'banner' 
          ? { banner_url: publicUrlData.publicUrl } 
          : { logo_url: publicUrlData.publicUrl };
          
        await onUpdate(updateData);
      } 
      // For gallery images, insert into club_images table
      else if (type === 'gallery') {
        const { error: dbError } = await supabase
          .from('club_images')
          .insert({
            club_id: club.id,
            url: publicUrlData.publicUrl,
            type: 'gallery',
            created_by: user.id
          });
          
        if (dbError) throw dbError;
        
        // Refresh gallery images
        fetchGalleryImages();
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      toast.error(`Failed to upload ${type}`);
      throw err;
    }
  };

  const handleDeleteImage = async (image: ClubImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;
    
    try {
      setLoading(true);
      
      // Extract the file path from the URL
      const urlParts = imageToDelete.url.split('/');
      const fileName = urlParts.slice(urlParts.indexOf('club-images') + 1).join('/');
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('club-images')
        .remove([fileName]);
        
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('club_images')
        .delete()
        .eq('id', imageToDelete.id);
        
      if (dbError) throw dbError;
      
      // Update state
      setGalleryImages(prev => prev.filter(img => img.id !== imageToDelete.id));
      toast.success('Image deleted successfully');
    } catch (err) {
      console.error('Error deleting image:', err);
      toast.error('Failed to delete image');
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Club Images</CardTitle>
          <CardDescription>
            Only club administrators can manage club images
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="h-5 w-5 mr-2" />
          Club Images
        </CardTitle>
        <CardDescription>
          Upload and manage images for your club
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="banner">Banner</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="banner" className="p-6 pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The banner image will be displayed at the top of your club page.
              Recommended size: 1200×400 pixels.
            </p>
            
            {club.banner_url ? (
              <div className="relative">
                <AspectRatio ratio={16/9} className="bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={club.banner_url} 
                    alt="Club banner" 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-12 bg-gray-50">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">No banner image</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a banner image for your club
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner
                  </Button>
                </div>
              </div>
            )}
            
            <Input 
              id="banner-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="logo" className="p-6 pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The logo will be used as the club's profile image.
              Recommended size: 400×400 pixels (square).
            </p>
            
            {club.logo_url ? (
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  <AspectRatio ratio={1} className="bg-gray-100 rounded-full overflow-hidden">
                    <img 
                      src={club.logo_url} 
                      alt="Club logo" 
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute bottom-0 right-0">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-12 bg-gray-50">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">No logo image</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a logo for your club
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            )}
            
            <Input 
              id="logo-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="gallery" className="p-6 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Upload images to showcase your club's activities.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('gallery-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <Input 
                id="gallery-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <AspectRatio ratio={16/9} key={i}>
                    <Skeleton className="h-full w-full rounded-md" />
                  </AspectRatio>
                ))}
              </div>
            ) : galleryImages.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-1">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <AspectRatio ratio={16/9} className="bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={image.url} 
                          alt="Gallery" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </AspectRatio>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleDeleteImage(image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-12 bg-gray-50">
                <div className="text-center">
                  <FileImage className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900">No gallery images</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload photos to showcase your club
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Image Cropper Dialog */}
      {showCropper && previewUrl && (
        <AlertDialog open={showCropper} onOpenChange={setShowCropper}>
          <AlertDialogContent className="max-w-screen-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Crop Image</AlertDialogTitle>
              <AlertDialogDescription>
                Adjust the crop area for your {activeTab} image.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="relative h-[400px] w-full my-4">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={activeTab === 'logo' ? 1 : 16/9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            
            <div className="flex items-center mb-4">
              <Label className="mr-4">Zoom:</Label>
              <Input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCropCancel} disabled={loading}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCropConfirm} 
                disabled={loading}
                className="bg-brand-purple hover:bg-brand-purple/90"
              >
                {loading ? 'Saving...' : 'Save Crop'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteImage} 
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ClubImageUploader; 