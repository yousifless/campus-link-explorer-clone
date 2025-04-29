import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadAvatar, testImageUrl, getSignedUrl } from '@/utils/storage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Camera, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AvatarSize = 'sm' | 'md' | 'lg';

interface ProfileAvatarProps {
  userId: string;
  onAvatarUpdated?: (url: string) => void;
  size?: AvatarSize;
  showCard?: boolean;
}

// Define a type for the profile
interface ProfileData {
  id: string;
  avatar_url: string | null;
  avatar_signed_url?: string | null;
  first_name: string | null;
  last_name: string | null;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  userId, 
  onAvatarUpdated,
  size = 'md',
  showCard = true
}) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [imageAccessible, setImageAccessible] = useState(true);
  const [authError, setAuthError] = useState<boolean>(false);
  const [showHover, setShowHover] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Size mapping
  const sizeMap = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  useEffect(() => {
    // Check authentication status first
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Authentication error:", error);
          setAuthError(true);
          setError("Authentication error: " + error.message);
          return;
        }
        
        if (!data.session) {
          console.error("No active session");
          setAuthError(true);
          setError("Please log in to view your profile");
          return;
        }
        
        // If authenticated, fetch profile
        fetchProfile();
      } catch (e) {
        console.error("Auth check exception:", e);
        setAuthError(true);
        setError("An unexpected error occurred");
      }
    };
    
    checkAuth();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // First try to select with avatar_signed_url
      let { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, avatar_signed_url, first_name, last_name')
        .eq('id', userId)
        .single();
      
      // If there's an error about the column not existing, try without it
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.log("avatar_signed_url column not found, trying without it");
        const result = await supabase
          .from('profiles')
          .select('id, avatar_url, first_name, last_name')
          .eq('id', userId)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error fetching profile:", error);
        setError(`Failed to load profile: ${error.message}`);
        return;
      }
      
      console.log("Profile data:", data);
      setProfile(data as ProfileData);

      // Test if the avatar URL is accessible
      if (data.avatar_url) {
        const img = new Image();
        img.onload = () => setImageAccessible(true);
        img.onerror = () => {
          setImageAccessible(false);
          // If public URL is not accessible, try to get a signed URL
          if (data.avatar_signed_url) {
            setSignedUrl(data.avatar_signed_url);
            setUsingFallback(true);
          } else {
            generateSignedUrl(data.avatar_url);
          }
        };
        img.src = data.avatar_url;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    }
  };

  const generateSignedUrl = async (publicUrl: string) => {
    try {
      // Extract the path from the public URL
      const path = publicUrl.split('/').pop();
      if (!path) throw new Error('Invalid avatar URL');

      const signedUrl = await getSignedUrl('avatars', `${userId}/${path}`);
      setSignedUrl(signedUrl);
      setUsingFallback(true);

      // Try to update the profile with the new signed URL
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_signed_url: signedUrl })
          .eq('id', userId);

        if (error) {
          console.warn("Could not update avatar_signed_url:", error);
          // Continue anyway, as we have the signed URL in state
        }
      } catch (updateError) {
        console.warn("Error updating avatar_signed_url:", updateError);
        // Continue anyway, as we have the signed URL in state
      }
    } catch (error) {
      console.error('Error generating signed URL:', error);
      setError('Failed to generate signed URL');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      const file = event.target.files?.[0];
      if (!file) return;

      const avatarUrl = await uploadAvatar(file);
      
      // Generate a signed URL for the new avatar
      const path = avatarUrl.split('/').pop();
      if (!path) throw new Error('Invalid avatar URL');
      
      const signedUrl = await getSignedUrl('avatars', `${userId}/${path}`);

      // Try to update profile with both URLs
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: avatarUrl,
            avatar_signed_url: signedUrl
          })
          .eq('id', userId);

        if (error) {
          // If there's an error about the column not existing, try without it
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log("avatar_signed_url column not found, updating only avatar_url");
            const result = await supabase
              .from('profiles')
              .update({ avatar_url: avatarUrl })
              .eq('id', userId);
            
            if (result.error) throw result.error;
          } else {
            throw error;
          }
        }
      } catch (updateError) {
        console.error("Error updating profile:", updateError);
        // Continue anyway, as we have the URLs in state
      }

      setProfile(prev => prev ? {
        ...prev,
        avatar_url: avatarUrl,
        avatar_signed_url: signedUrl
      } : null);
      
      setSignedUrl(signedUrl);
      setUsingFallback(false);
      setImageAccessible(true);

      // Notify parent component if callback provided
      if (onAvatarUpdated) {
        onAvatarUpdated(avatarUrl);
      }

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been successfully updated.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
      
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your avatar. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageError = () => {
    console.error("Image failed to load, trying fallback");
    setUsingFallback(true);
  };

  const copyAvatarUrl = () => {
    if (profile?.avatar_url) {
      navigator.clipboard.writeText(profile.avatar_url);
      setCopied(true);
      
      toast({
        title: "URL Copied",
        description: "Avatar URL copied to clipboard",
        duration: 2000,
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="w-full">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const avatarContent = (
    <div className="relative">
      {uploading ? (
        <div className={`flex items-center justify-center ${sizeMap[size]}`}>
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div 
          className="relative"
          onMouseEnter={() => setShowHover(true)}
          onMouseLeave={() => setShowHover(false)}
        >
          <Avatar className={sizeMap[size]}>
            <AvatarImage 
              src={usingFallback ? signedUrl || undefined : profile?.avatar_url || undefined} 
              alt={profile?.first_name || 'Profile avatar'} 
              onError={() => setUsingFallback(true)}
            />
            <AvatarFallback className="bg-[#4292c6] text-white text-xl">
              {profile?.first_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* Hover overlay with camera icon */}
          <motion.div 
            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: showHover ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              onChange={(e) => {
                // handle avatar upload
                console.log('Upload triggered');
              }}
              disabled={uploading}
              accept="image/*"
            />
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
            </label>
          </motion.div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="w-full mt-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {imageAccessible === false && profile?.avatar_url && (
        <Alert variant="destructive" className="w-full mt-2">
          <AlertTitle>Image Not Accessible</AlertTitle>
          <AlertDescription>
            The avatar image URL is not accessible. This might be due to CORS issues or the bucket being private.
            {signedUrl ? " Using signed URL as fallback." : " Try making the bucket public or setting up appropriate RLS policies."}
          </AlertDescription>
        </Alert>
      )}
      
      {profile?.avatar_url && (
        <div className="mt-2 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={copyAvatarUrl}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy avatar URL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );

  return showCard ? (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {avatarContent}
        </div>
      </CardContent>
    </Card>
  ) : (
    <div className="relative">
      {avatarContent}
    </div>
  );
};
