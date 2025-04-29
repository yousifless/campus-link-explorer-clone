
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Camera, 
  Upload, 
  Loader2, 
  Shield, 
  Globe, 
  Languages as LanguagesIcon,
  Heart,
  Briefcase,
  BookOpen,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { makeBucketPublic } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

interface ProfileAvatarProps {
  userId: string;
  onAvatarUpdated: (url: string) => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ userId, onAvatarUpdated }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function downloadImage() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (error) {
          throw error;
        }

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error downloading image: ', error);
      }
    }

    downloadImage();
  }, [userId]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      onAvatarUpdated(publicUrl);
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `${error instanceof Error ? error.message : 'Error uploading avatar'}`,
      });
      console.error('Error uploading avatar: ', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
          <AvatarImage src={avatarUrl || undefined} alt="Profile" />
          <AvatarFallback>
            <User className="h-16 w-16 text-gray-400" />
          </AvatarFallback>
        </Avatar>
        
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          <div className="flex flex-col items-center text-white">
            <Camera className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Change</span>
          </div>
          <input
            type="file"
            id="avatar"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </label>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
      
      <p className="mt-4 text-sm text-gray-500">
        Click on the avatar to upload a new image
      </p>
    </motion.div>
  );
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketPublic, setBucketPublic] = useState<boolean | null>(null);
  const [makingPublic, setMakingPublic] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          setError(`Error getting user: ${userError.message}`);
          return;
        }
        
        if (!user) {
          console.error("No user found");
          setError("No authenticated user found");
          return;
        }
        
        setUserId(user.id);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, university:university_id(*), campus:campus_id(*)')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error getting profile:", profileError);
          setError(`Error getting profile: ${profileError.message}`);
          return;
        }

        setProfileData(profileData);
        
        // Check if the avatar bucket is public
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error("Error listing buckets:", bucketsError);
        } else {
          const avatarBucket = buckets.find(bucket => bucket.name === 'avatars');
          setBucketPublic(avatarBucket?.public || false);
        }
        
        // Get languages and interests
        const { data: languagesData } = await supabase.from('languages').select('*');
        const { data: interestsData } = await supabase.from('interests').select('*');
        
        if (languagesData) setLanguages(languagesData);
        if (interestsData) setInterests(interestsData);
        
        // Get user languages
        const { data: userLanguages } = await supabase
          .from('user_languages')
          .select('language_id, proficiency')
          .eq('user_id', user.id);
        
        // Get user interests
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', user.id);
        
        // Update profile data with languages and interests
        if (profileData) {
          setProfileData({
            ...profileData,
            languagesDetails: userLanguages || [],
            interestsDetails: userInterests?.map(i => i.interest_id) || []
          });
        }
        
      } catch (error) {
        console.error("Error in loadUser:", error);
        setError(`Error loading user: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const handleMakeBucketPublic = async () => {
    try {
      setMakingPublic(true);
      await makeBucketPublic();
      setBucketPublic(true);
      toast({
        title: "Success",
        description: "Avatar bucket is now public. Your avatar will be visible to others.",
      });
    } catch (error) {
      console.error("Error making bucket public:", error);
      setError(`Error making bucket public: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to make avatar bucket public: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setMakingPublic(false);
    }
  };

  const handleAvatarUpdated = (url: string) => {
    console.log("Avatar updated with URL:", url);
    if (profileData) {
      setProfileData({
        ...profileData,
        avatar_url: url
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={() => navigate('/')} 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You need to be logged in to view your profile.</p>
              <Button 
                onClick={() => navigate('/login')} 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const getLanguageName = (languageId: string) => {
    const language = languages.find(l => l.id === languageId);
    return language ? language.name : 'Unknown';
  };

  const getInterestName = (interestId: string) => {
    const interest = interests.find(i => i.id === interestId);
    return interest ? interest.name : 'Unknown';
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <Tabs defaultValue="profile" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <TabsList className="bg-indigo-50">
              <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <User className="mr-2 h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="avatar" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Camera className="mr-2 h-4 w-4" /> Avatar
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="profile">
            {profileData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Summary Card */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="overflow-hidden">
                    {/* Profile header with background */}
                    <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                    
                    {/* Avatar and basic info */}
                    <CardContent className="pt-0 relative">
                      <div className="-mt-16 mb-4 flex justify-center">
                        <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                          <AvatarImage src={profileData.avatar_url || undefined} alt="Profile" />
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-4xl">
                            {profileData.first_name?.[0]}{profileData.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">{profileData.first_name} {profileData.last_name}</h2>
                        {profileData.nickname && (
                          <p className="text-gray-500">"{profileData.nickname}"</p>
                        )}
                        
                        <div className="mt-2 flex justify-center">
                          <Badge className={`${profileData.student_type === 'international' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {profileData.student_type === 'international' ? 'International Student' : 'Local Student'}
                          </Badge>
                          
                          {profileData.is_verified && (
                            <Badge className="ml-2 bg-green-100 text-green-700">
                              <Shield className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick stats */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-semibold text-indigo-600">{profileData.interestsDetails?.length || 0}</p>
                          <p className="text-xs text-gray-500">Interests</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-semibold text-indigo-600">{profileData.languagesDetails?.length || 0}</p>
                          <p className="text-xs text-gray-500">Languages</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-semibold text-indigo-600">{profileData.year_of_study || '-'}</p>
                          <p className="text-xs text-gray-500">Year</p>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <Button 
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        onClick={() => navigate('/profile')}
                      >
                        <User className="mr-2 h-4 w-4" /> Edit Profile
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Profile Details */}
                <motion.div 
                  className="md:col-span-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Bio section */}
                      {profileData.bio && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">About Me</h3>
                          <p className="text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-100">
                            {profileData.bio}
                          </p>
                        </div>
                      )}
                      
                      {/* Academic info */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <BookOpen className="mr-2 h-5 w-5 text-indigo-600" />
                          Academic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-500">University</p>
                            <p className="font-medium">{profileData.university?.name || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-500">Campus</p>
                            <p className="font-medium">{profileData.campus?.name || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-500">Major</p>
                            <p className="font-medium">{profileData.major_id || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-500">Year of Study</p>
                            <p className="font-medium">{profileData.year_of_study || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Background */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <Globe className="mr-2 h-5 w-5 text-indigo-600" />
                          Background
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                            <p className="text-sm text-gray-500">Nationality</p>
                            <p className="font-medium">{profileData.nationality || 'Not specified'}</p>
                          </div>
                          
                          {profileData.cultural_insight && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                              <p className="text-sm text-gray-500">Cultural Insights</p>
                              <p className="font-medium">{profileData.cultural_insight}</p>
                            </div>
                          )}
                          
                          {profileData.location && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 flex items-start">
                              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                              <p className="font-medium">{profileData.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Languages */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <LanguagesIcon className="mr-2 h-5 w-5 text-indigo-600" />
                          Languages
                        </h3>
                        
                        <div className="flex flex-wrap gap-2">
                          {profileData.languagesDetails && profileData.languagesDetails.length > 0 ? (
                            profileData.languagesDetails.map((lang: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-indigo-50 text-indigo-700 px-3 py-1.5 border-indigo-100">
                                {getLanguageName(lang.language_id)}
                                {lang.proficiency && (
                                  <span className="ml-1 text-xs text-indigo-400">({lang.proficiency})</span>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-gray-500">No languages specified</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Interests */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center">
                          <Heart className="mr-2 h-5 w-5 text-pink-600" />
                          Interests
                        </h3>
                        
                        <div className="flex flex-wrap gap-2">
                          {profileData.interestsDetails && profileData.interestsDetails.length > 0 ? (
                            profileData.interestsDetails.map((interestId: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-pink-50 text-pink-700 px-3 py-1.5 border-pink-100">
                                {getInterestName(interestId)}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-gray-500">No interests specified</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="avatar">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Avatar Upload */}
              <motion.div 
                className="md:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Profile Avatar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userId && (
                      <ProfileAvatar 
                        userId={userId} 
                        onAvatarUpdated={handleAvatarUpdated} 
                      />
                    )}
                    
                    <div className="mt-8 bg-indigo-50 p-4 rounded-md border border-indigo-100">
                      <h3 className="font-medium text-indigo-800 mb-2">Tips for a great profile photo:</h3>
                      <ul className="space-y-2 text-indigo-700">
                        <li className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">✓</div>
                          Use a clear, well-lit photo of your face
                        </li>
                        <li className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">✓</div>
                          Choose a recent photo that looks like you today
                        </li>
                        <li className="flex items-center">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">✓</div>
                          Your face should take up about 60% of the frame
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Bucket Visibility */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {bucketPublic === false && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 mb-4">
                        <p className="text-yellow-800 mb-2">
                          <span className="font-medium">Note:</span> Your avatar storage is currently private. Other users won't be able to see your avatar.
                        </p>
                        <p className="text-yellow-700 text-sm">
                          To make your avatar visible to others, you need to make the storage bucket public.
                        </p>
                      </div>
                      <Button 
                        onClick={handleMakeBucketPublic} 
                        disabled={makingPublic}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
                      >
                        {makingPublic ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Making Bucket Public...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Make Avatar Public
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {bucketPublic === true && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-md border border-green-100">
                        <p className="text-green-800 flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          <span className="font-medium">Avatar is publicly visible</span>
                        </p>
                        <p className="text-green-700 text-sm mt-2">
                          Your avatar is now visible to other users on the platform.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">Profile settings will be added here in future updates.</p>
                
                <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                  <h3 className="font-medium text-indigo-800 mb-2">Coming Soon</h3>
                  <ul className="space-y-2 text-indigo-700">
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">●</div>
                      Privacy control settings
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">●</div>
                      Notification preferences
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-sm">●</div>
                      Account security options
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
