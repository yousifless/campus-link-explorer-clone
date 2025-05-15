
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCircle, 
  Edit,
  X,
  Camera,
  GraduationCap,
  Globe,
  Languages,
  Heart,
  CheckCircle,
  BookOpen,
  MapPin
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfileCompletionIndicator from '@/components/profile/ProfileCompletionIndicator';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileView from '@/components/profile/ProfileView';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUploadHint, setShowUploadHint] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px -15px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.2
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const { data: univData, error: univError } = await supabase
          .from('universities')
          .select('*')
          .order('name');
        
        if (univError) throw univError;
        setUniversities(univData || []);

        const { data: majorsData, error: majorsError } = await supabase
          .from('majors')
          .select('*')
          .order('name');
        
        if (majorsError) throw majorsError;
        setMajors(majorsData || []);

        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('*')
          .order('name');
        
        if (languagesError) throw languagesError;
        setLanguages(languagesData || []);

        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('*')
          .order('name');
        
        if (interestsError) throw interestsError;
        setInterests(interestsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.campus_id) {
        supabase
          .from('campuses')
          .select('*')
          .eq('university_id', profile.university_id)
          .then(({ data, error }) => {
            if (!error && data) {
              setCampuses(data);
            }
          });
      }

      supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedLanguages(data);
          }
        });

      supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedInterests(data.map(i => i.interest_id));
          }
        });
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/profile-setup");
    }
  }, [loading, profile, navigate]);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${profile.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', profile.id);
          
        if (error) throw error;
        
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully!",
        });
        
        // Refresh profile data
        window.location.reload();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was a problem uploading your image.",
      });
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/4">
            <Skeleton className="h-64 w-full rounded-xl mb-6" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="md:w-1/4 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeIn}
      className="container mx-auto px-4 py-8"
    >
      {/* Hero Section */}
      <motion.div 
        variants={cardVariants}
        whileHover="hover"
        className="relative rounded-xl overflow-hidden mb-8 bg-white shadow-lg"
      >
        {/* Banner Background */}
        <div className="h-48 bg-gradient-to-r from-violet-500 to-fuchsia-500 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=1000')] bg-cover bg-center mix-blend-soft-light opacity-20"></div>
        </div>
        
        {/* Profile Avatar */}
        <div className="absolute -bottom-16 left-8 sm:left-12">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
              <AvatarImage 
                src={profile?.avatar_url || undefined} 
                alt="Profile" 
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white text-4xl">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload overlay */}
            <label 
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
              onMouseEnter={() => setShowUploadHint(true)}
              onMouseLeave={() => setShowUploadHint(false)}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin">
                  <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </label>
            
            {/* Upload hint tooltip */}
            {showUploadHint && (
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Change profile picture
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="pt-20 pb-6 px-8 sm:px-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</h1>
              {profile?.nickname && (
                <p className="text-gray-500">"{profile.nickname}"</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {profile?.student_type && (
                  <Badge className={`${
                    profile.student_type === 'international' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    } text-white border-0 px-3 py-1`}
                  >
                    {profile.student_type === 'international' ? 'International Student' : 'Local Student'}
                  </Badge>
                )}
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={isEditing ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 hover:opacity-90 shadow-md"
              >
                {isEditing ? (
                  <>
                    <X size={16} className="mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit size={16} className="mr-1" />
                    Edit Profile
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2">
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white rounded-xl overflow-hidden shadow-lg h-full border border-gray-100"
          >
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
                {!isEditing && profile?.completeness < 1 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      Complete your profile
                    </span>
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-6">
              {isEditing ? (
                <ProfileForm 
                  isEditing={isEditing} 
                  setIsEditing={setIsEditing} 
                />
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <ProfileView 
                    profile={profile}
                    universities={universities}
                    campuses={campuses}
                    majors={majors}
                    selectedLanguages={selectedLanguages}
                    selectedInterests={selectedInterests}
                    languages={languages}
                    interests={interests}
                  />
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="overflow-hidden"
          >
            <ProfileCompletionIndicator profile={profile} />
          </motion.div>
          
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="rounded-xl overflow-hidden"
          >
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-indigo-50">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100/30">
                <CardTitle className="text-lg font-medium text-indigo-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start transition-all hover:bg-indigo-50 hover:translate-x-1 group"
                          size="sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                            <UserCircle className="text-white" size={16} />
                          </div>
                          <span>View Public Profile</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>See how others view your profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start transition-all hover:bg-green-50 hover:translate-x-1 group"
                          size="sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                            <GraduationCap className="text-white" size={16} />
                          </div>
                          <span>Update Education</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update your education information</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start transition-all hover:bg-pink-50 hover:translate-x-1 group"
                          size="sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                            <Heart className="text-white" size={16} />
                          </div>
                          <span>Manage Interests</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update your interests</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start transition-all hover:bg-blue-50 hover:translate-x-1 group"
                          size="sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                            <Languages className="text-white" size={16} />
                          </div>
                          <span>Update Languages</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update your language proficiencies</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="rounded-xl overflow-hidden"
          >
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/30">
                <CardTitle className="text-lg font-medium text-purple-900">Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                        <Globe className="text-white" size={16} />
                      </div>
                      <span className="text-sm font-medium">Languages</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 px-2">
                      {selectedLanguages.length}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                        <Heart className="text-white" size={16} />
                      </div>
                      <span className="text-sm font-medium">Interests</span>
                    </div>
                    <Badge className="bg-pink-100 text-pink-700 px-2">
                      {selectedInterests.length}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <BookOpen className="text-white" size={16} />
                      </div>
                      <span className="text-sm font-medium">Major</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 px-2 truncate max-w-[120px]">
                      {majors.find(m => m.id === profile?.major_id)?.name || 'Not set'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                        <MapPin className="text-white" size={16} />
                      </div>
                      <span className="text-sm font-medium">University</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 px-2 truncate max-w-[120px]">
                      {universities.find(u => u.id === profile?.university_id)?.name || 'Not set'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
