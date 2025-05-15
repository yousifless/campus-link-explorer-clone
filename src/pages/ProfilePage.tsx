import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Camera, 
  CheckCircle,
  X,
  Loader2, 
  Shield, 
  Globe, 
  Languages as LanguagesIcon,
  Heart,
  Briefcase,
  BookOpen,
  MapPin,
  Edit3,
  Save,
  Plus,
  School,
  GraduationCap,
  Building,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { makeBucketPublic } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvailabilityCalendar } from '@/components/profile/AvailabilityCalendar';
import { InterestsModal } from '@/components/profile/InterestsModal';
import LanguagesModal from '@/components/profile/LanguagesModal'; // Fixed: Changed from named import to default import
import { MeetupPreferences } from '@/components/profile/MeetupPreferences';
import { useAuth } from '@/contexts/AuthContext';
import UserBadges from '@/components/profile/UserBadges';

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 }
  }
};

const cardVariants = {
  initial: { scale: 0.98, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    scale: 0.98, 
    opacity: 0,
    transition: { duration: 0.3 }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.2 }
  }
};

const EditableField = ({ 
  label, 
  value, 
  onSave, 
  type = 'text',
  placeholder = 'Enter value...',
  options = [],
  fieldKey,
  isLoading = false,
  icon: Icon = Edit3 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);
  
  useEffect(() => {
    setFieldValue(value);
  }, [value]);
  
  const handleSave = async () => {
    await onSave(fieldKey, fieldValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setFieldValue(value);
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {isEditing ? (
    <motion.div 
          initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mb-4"
        >
          <div className="flex items-center mb-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
          </div>
          
          {type === 'textarea' ? (
            <Textarea
              value={fieldValue || ''}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder={placeholder}
              className="mb-2"
              rows={4}
            />
          ) : type === 'select' ? (
            <Select 
              value={fieldValue || ''} 
              onValueChange={setFieldValue}
            >
              <SelectTrigger className="mb-2">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={type}
              value={fieldValue || ''}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder={placeholder}
              className="mb-2"
            />
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              size="sm" 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
            <Button 
              onClick={handleCancel} 
              size="sm" 
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="py-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">{label}</div>
            <Button 
              onClick={() => setIsEditing(true)} 
              size="sm" 
              variant="ghost" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon className="h-4 w-4" />
            </Button>
          </div>
          {value ? (
            <div className="font-medium text-gray-800 mt-1">{value}</div>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 pl-0 hover:bg-transparent hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add {label}
            </Button>
        )}
      </div>
      )}
    </div>
  );
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [majors, setMajors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);
  const [updatingField, setUpdatingField] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Error getting user:", userError || "No user found");
          setError(userError?.message || "No authenticated user found");
          return;
        }
        
        setUserId(user.id);

        // Load universities
        const { data: universitiesData } = await supabase.from('universities').select('*');
        setUniversities(universitiesData || []);
        
        // Load majors
        const { data: majorsData } = await supabase.from('majors').select('*');
        setMajors(majorsData || []);
        
        // Load languages
        const { data: languagesData } = await supabase.from('languages').select('*');
        setLanguages(languagesData || []);
        
        // Load interests
        const { data: interestsData } = await supabase.from('interests').select('*');
        setInterests(interestsData || []);
        
        // Get user profile with related data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            university:university_id(id, name),
            campus:campus_id(id, name),
            major:major_id(id, name)
          `)
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error getting profile:", profileError);
          setError(`Error getting profile: ${profileError.message}`);
          return;
        }
        
        // Get user languages
        const { data: userLanguages } = await supabase
          .from('user_languages')
          .select('language_id, language:languages(id, name), proficiency')
          .eq('user_id', user.id);
        
        // Get user interests
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interest_id, interest:interests(id, name)')
          .eq('user_id', user.id);
        
          setProfileData({
          ...profile,
          languages: userLanguages?.map(l => ({
            id: l.language_id,
            name: l.language?.name || 'Unknown',
            proficiency: l.proficiency
          })) || [],
          interests: userInterests?.map(i => ({
            id: i.interest_id,
            name: i.interest?.name || 'Unknown'
          })) || []
        });
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  const handleUpdateField = async (field, value) => {
    if (!userId) return;
    
    try {
      setUpdatingField(field);
      
      // Update the field in the database
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `${error.message || 'Error updating profile'}`,
      });
      console.error('Error updating profile:', error);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleUploadAvatar = async (event) => {
    try {
      if (!userId) return;
      
      setUploadingAvatar(true);

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

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
      
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Error uploading avatar',
      });
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getUniversityName = (id) => {
    const university = universities.find(u => u.id === id);
    return university ? university.name : 'Unknown';
  };

  const getMajorName = (id) => {
    const major = majors.find(m => m.id === id);
    return major ? major.name : 'Unknown';
  };

  const getLanguageName = (id) => {
    const language = languages.find(l => l.id === id);
    return language ? language.name : 'Unknown';
  };

  const getInterestName = (id) => {
    const interest = interests.find(i => i.id === id);
    return interest ? interest.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your profile...</p>
          <p className="text-sm text-gray-500 mt-2">Just a moment, we're gathering your information</p>
        </motion.div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="max-w-5xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal profile and preferences</p>
          </div>
          
        {/* Hero section with cover image and avatar */}
                <motion.div 
          className="relative rounded-xl overflow-hidden mb-8 bg-white shadow-md"
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
        >
          <div className="h-48 bg-gradient-to-r from-violet-500 to-fuchsia-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    
          <div className="absolute top-32 left-8 sm:left-12">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg bg-white">
                <AvatarImage src={profileData?.avatar_url || undefined} alt="Profile" />
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 text-4xl">
                  {profileData?.first_name?.[0]}{profileData?.last_name?.[0]}
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
                  onChange={handleUploadAvatar}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                          )}
                        </div>
                      </div>
                      
          <div className="pt-20 pb-6 px-8 sm:px-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <EditableField
                  label="Name"
                  value={`${profileData?.first_name || ''} ${profileData?.last_name || ''}`}
                  onSave={(_, fullName) => {
                    const [firstName, ...lastNameParts] = fullName.split(' ');
                    const lastName = lastNameParts.join(' ');
                    return Promise.all([
                      handleUpdateField('first_name', firstName),
                      handleUpdateField('last_name', lastName)
                    ]);
                  }}
                  placeholder="Your full name"
                  fieldKey="full_name"
                  isLoading={updatingField === 'first_name' || updatingField === 'last_name'}
                  icon={User}
                />
                
                <EditableField
                  label="Nickname"
                  value={profileData?.nickname || ''}
                  onSave={handleUpdateField}
                  placeholder="Your nickname (optional)"
                  fieldKey="nickname"
                  isLoading={updatingField === 'nickname'}
                />
                      </div>
                      
              <div>
                <Badge className={`${profileData?.student_type === 'international' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'} px-3 py-1.5 text-sm font-medium`}>
                  {profileData?.student_type === 'international' ? 'International Student' : 'Local Student'}
                </Badge>
                        </div>
                        </div>
                        </div>
        </motion.div>
                      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-1 space-y-6">
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="col-span-1 md:col-span-2"
            >
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                  <CardTitle className="flex items-center text-xl text-indigo-700">
                    <User className="mr-2 h-5 w-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <EditableField
                    label="Bio"
                    value={profileData?.bio || ''}
                    onSave={handleUpdateField}
                    placeholder="Tell others about yourself..."
                    fieldKey="bio"
                    isLoading={updatingField === 'bio'}
                    type="textarea"
                  />
                    </CardContent>
                  </Card>
                </motion.div>
                
            {/* Education */}
                <motion.div 
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                    >
                <Card className="h-full border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 pb-3">
                    <CardTitle className="flex items-center text-xl text-amber-700">
                      <School className="mr-2 h-5 w-5" />
                      Education
                    </CardTitle>
                    </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <EditableField
                      label="University"
                      value={profileData?.university?.name || getUniversityName(profileData?.university_id)}
                      onSave={handleUpdateField}
                      fieldKey="university_id"
                      isLoading={updatingField === 'university_id'}
                      type="select"
                      options={universities.map(u => ({ value: u.id, label: u.name }))}
                      icon={Building}
                    />
                            
                    <EditableField
                      label="Major"
                      value={profileData?.major?.name || getMajorName(profileData?.major_id)}
                      onSave={handleUpdateField}
                      fieldKey="major_id"
                      isLoading={updatingField === 'major_id'}
                      type="select"
                      options={majors.map(m => ({ value: m.id, label: m.name }))}
                      icon={BookOpen}
                    />
                              
                    <EditableField
                      label="Year of Study"
                      value={profileData?.year_of_study?.toString() || ''}
                      onSave={(field, value) => handleUpdateField(field, parseInt(value) || null)}
                      fieldKey="year_of_study"
                      isLoading={updatingField === 'year_of_study'}
                      type="number"
                      icon={GraduationCap}
                    />
                  </CardContent>
                </Card>
              </motion.div>
                  
          {/* Location and Contact */}
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <Card className="h-full border-0 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                        <CardTitle className="flex items-center text-xl text-green-700">
                          <MapPin className="mr-2 h-5 w-5" />
                          Location & Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <EditableField
                          label="Location"
                          value={profileData?.location || ''}
                          onSave={handleUpdateField}
                          placeholder="Your location"
                          fieldKey="location"
                          isLoading={updatingField === 'location'}
                          icon={MapPin}
                        />
                        
                        <EditableField
                          label="Email"
                          value={profileData?.email || ''}
                          onSave={handleUpdateField}
                          placeholder="Your email address"
                          fieldKey="email"
                          isLoading={updatingField === 'email'}
                          type="email"
                        />
                        
                        <EditableField
                          label="Phone"
                          value={profileData?.phone || ''}
                          onSave={handleUpdateField}
                          placeholder="Your phone number"
                          fieldKey="phone"
                          isLoading={updatingField === 'phone'}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                      
                      {/* Languages */}
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <Card className="h-full border-0 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
                        <CardTitle className="flex items-center text-xl text-blue-700">
                          <LanguagesIcon className="mr-2 h-5 w-5" />
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-3">Your languages</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {profileData?.languages && profileData.languages.length > 0 ? (
                              profileData.languages.map((lang, idx) => (
                                <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1.5 border-blue-200">
                                  {lang.name} {lang.proficiency && <span className="text-blue-400">({lang.proficiency})</span>}
                              </Badge>
                            ))
                          ) : (
                              <p className="text-gray-500 italic text-sm">No languages specified</p>
                          )}
                        </div>
                      </div>
                        
                        <LanguagesModal 
                          userLanguages={profileData?.languages} 
                          onOpenChange={(open) => {}} // Add the missing prop
                          onSave={async (languages) => {
                            if (!userId) return;
                            try {
                              // First delete existing user languages
                              await supabase
                                .from('user_languages')
                                .delete()
                                .eq('user_id', userId);
                              
                              // Then insert new ones
                              if (languages.length > 0) {
                                const languagesToInsert = languages.map(lang => ({
                                  user_id: userId,
                                  language_id: lang.id,
                                  proficiency: lang.proficiency
                                }));
                                
                                const { error } = await supabase
                                  .from('user_languages')
                                  .insert(languagesToInsert);
                                
                                if (error) throw error;
                              }
                              
                              // Update local state
                              setProfileData(prev => ({
                                ...prev,
                                languages: languages
                              }));
                              
                              toast({
                                title: "Success",
                                description: "Languages updated successfully!",
                              });
                            } catch (error) {
                              console.error('Error updating languages:', error);
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update languages",
                              });
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                      
                      {/* Interests */}
                  <motion.div
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    <Card className="h-full border-0 shadow-md">
                      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 pb-3">
                        <CardTitle className="flex items-center text-xl text-pink-700">
                          <Heart className="mr-2 h-5 w-5" />
                          Interests
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-3">Your interests</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {profileData?.interests && profileData.interests.length > 0 ? (
                              profileData.interests.map((interest, idx) => (
                                <Badge key={idx} variant="outline" className="bg-pink-50 text-pink-700 px-3 py-1.5 border-pink-200">
                                  {interest.name}
                              </Badge>
                            ))
                          ) : (
                              <p className="text-gray-500 italic text-sm">No interests specified</p>
                          )}
                        </div>
                      </div>
                        
                        <InterestsModal 
                          userInterests={profileData?.interests} 
                          onSave={async (interests) => {
                            if (!userId) return;
                            try {
                              // First delete existing user interests
                              await supabase
                                .from('user_interests')
                                .delete()
                                .eq('user_id', userId);
                              
                              // Then insert new ones
                              if (interests.length > 0) {
                                const interestsToInsert = interests.map(interest => ({
                                  user_id: userId,
                                  interest_id: interest.id
                                }));
                                
                                const { error } = await supabase
                                  .from('user_interests')
                                  .insert(interestsToInsert);
                                
                                if (error) throw error;
                              }
                              
                              // Update local state
                              setProfileData(prev => ({
                                ...prev,
                                interests: interests
                              }));
                              
                              toast({
                                title: "Success",
                                description: "Interests updated successfully!",
                              });
                            } catch (error) {
                              console.error('Error updating interests:', error);
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to update interests",
                              });
                            }
                          }}
                        />
                    </CardContent>
                  </Card>
                </motion.div>
          
          {/* Cultural Background */}
              <motion.div 
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="col-span-1 md:col-span-2"
                  >
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-3">
                    <CardTitle className="flex items-center text-xl text-purple-700">
                      <Globe className="mr-2 h-5 w-5" />
                      Cultural Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <EditableField
                        label="Nationality"
                        value={profileData?.nationality || ''}
                        onSave={handleUpdateField}
                        placeholder="Your nationality"
                        fieldKey="nationality"
                        isLoading={updatingField === 'nationality'}
                        icon={Globe}
                      />
                    </div>
                    
                    <div>
                      <EditableField
                        label="Cultural Insights"
                        value={profileData?.cultural_insight || ''}
                        onSave={handleUpdateField}
                        placeholder="Share insights about your culture..."
                        fieldKey="cultural_insight"
                        isLoading={updatingField === 'cultural_insight'}
                        type="textarea"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
          {/* Availability */}
              <motion.div 
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                className="col-span-1 md:col-span-2"
              >
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-3">
                    <CardTitle className="flex items-center text-xl text-indigo-700">
                      <Calendar className="mr-2 h-5 w-5" />
                      Availability & Preferences
                    </CardTitle>
                    </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-medium mb-3">When are you available?</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Set your weekly availability to help others find times to connect with you
                      </p>
                      
                      <AvailabilityCalendar 
                        initialAvailability={profileData?.availability_json || {}}
                        onSave={async (availability) => {
                          if (!userId) return;
                          try {
                            // First delete existing availability
                            await supabase
                              .from('user_availability')
                              .delete()
                              .eq('user_id', userId);
                            
                            // Insert new availability entries
                            const availabilityEntries = Object.entries(availability).flatMap(
                              ([day, timeRanges]) => 
                                timeRanges.map(range => ({
                                  user_id: userId,
                                  day_of_week: day,
                                  start_time: range.start_time,
                                  end_time: range.end_time
                                }))
                            );
                            
                            if (availabilityEntries.length > 0) {
                              const { error } = await supabase
                                .from('user_availability')
                                .insert(availabilityEntries);
                                
                              if (error) throw error;
                            }
                            
                            // Also save a JSON representation to the profile for easier access
                            await supabase
                              .from('profiles')
                              .update({ 
                                availability_json: availability,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', userId);
                            
                            // Update local state
                            setProfileData(prev => ({
                              ...prev,
                              availability_json: availability
                            }));
                            
                            toast({
                              title: "Success",
                              description: "Your availability has been updated!",
                            });
                          } catch (error) {
                            console.error('Error updating availability:', error);
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to update availability",
                            });
                          }
                        }}
                      />
                      </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Matching Preferences</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Adjust how different factors are weighted when finding your matches
                    </p>
                    
                    <MeetupPreferences />
                      </div>
                    </CardContent>
                  </Card>
              </motion.div>
            </div>
                </div>
        
        <UserBadges />
      </motion.div>
    </div>
  );
};

export default ProfilePage;
