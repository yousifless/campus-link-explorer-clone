
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarProps {
  userId: string;
  onAvatarUpdated?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  userId,
  onAvatarUpdated,
  size = 'md',
  showCard = true
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sizeClass = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  };

  useEffect(() => {
    if (userId) {
      getAvatarUrl();
    }
  }, [userId]);

  const getAvatarUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching avatar URL:', error);
        return;
      }

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error in getAvatarUrl:', error);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          avatar_signed_url: avatarUrl
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(avatarUrl);
      
      if (onAvatarUpdated) {
        onAvatarUpdated(avatarUrl);
      }

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setError(error.message);
      
      toast({
        title: "Error",
        description: `Failed to update avatar: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const avatarComponent = (
    <div className="relative">
      <Avatar className={`${sizeClass[size]}`}>
        <AvatarImage src={avatarUrl || ''} alt="Profile" />
        <AvatarFallback>
          {userId.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <Label htmlFor="avatar-upload" className={`absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer ${size === 'sm' ? 'h-5 w-5' : 'h-7 w-7'}`}>
        <Camera className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          className="sr-only"
          disabled={uploading}
        />
      </Label>
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return avatarComponent;
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-center flex-col space-y-4">
        {avatarComponent}
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default ProfileAvatar;
