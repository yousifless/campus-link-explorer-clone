import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ProfileAvatar } from './ProfileAvatar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Edit, Save, X, UserCircle, School, Calendar, Globe, 
  MapPin, Book, Languages, Heart, GraduationCap, Flag, 
  Briefcase, Globe2, Clock, CheckCircle2, AlertCircle, Plus, 
  Star, StarHalf, Check, Search, X as XIcon, ChevronDown, ChevronUp,
  Sparkles, Zap, Award, Trophy, Target, Settings, Camera, Copy, 
  Share2, Eye, EyeOff, CheckCircle, AlertTriangle, Info, User, CircleDot,
  ChevronRight, Circle, Pencil
} from 'lucide-react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { debounce } from 'lodash';
import { notifyProfileUpdate, notifyInterestUpdate, notifyAcademicUpdate } from '@/utils/notifications';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  bio?: string;
  university_id?: string;
  campus_id?: string;
  major_id?: string;
  student_type?: 'international' | 'local';
  nationality?: string;
  year_of_study?: number;
  cultural_insight?: string;
  location?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  interests: string[];
  languages: {
    language_id: string;
    proficiency: string;
  }[];
  university?: {
    id: string;
    name: string;
  } | null;
  campus?: {
    id: string;
    name: string;
  } | null;
}

interface University {
  id: string;
  name: string;
}

interface Campus {
  id: string;
  name: string;
  university_id: string;
}

interface Major {
  id: string;
  name: string;
}

interface Language {
  id: string;
  name: string;
}

interface Interest {
  id: string;
  name: string;
}

// Interest categories with their respective interests
const interestCategories = {
  'Academic': [
    { id: 'astronomy', name: 'Astronomy' },
    { id: 'biology', name: 'Biology' },
    { id: 'coding', name: 'Coding/Programming' },
    { id: 'historical-research', name: 'Historical Research' },
    { id: 'online-courses', name: 'Online Courses' }
  ],
  'Arts & Culture': [
    { id: 'animation', name: 'Animation' },
    { id: 'book-clubs', name: 'Book Clubs' },
    { id: 'creative-writing', name: 'Creative Writing' },
    { id: 'cultural-festivals', name: 'Cultural Festivals' },
    { id: 'drawing', name: 'Drawing' },
    { id: 'film-critique', name: 'Film Critique' },
    { id: 'museums', name: 'Museums' },
    { id: 'music-festivals', name: 'Music Festivals' },
    { id: 'painting', name: 'Painting' }
  ],
  'Lifestyle': [
    { id: 'backpacking', name: 'Backpacking' },
    { id: 'camping', name: 'Camping' },
    { id: 'coffee-culture', name: 'Coffee Culture' },
    { id: 'cooking', name: 'Cooking' },
    { id: 'fashion-design', name: 'Fashion Design' },
    { id: 'food-blogging', name: 'Food Blogging' },
    { id: 'meditation', name: 'Meditation' },
    { id: 'mindfulness', name: 'Mindfulness' }
  ],
  'Sports & Fitness': [
    { id: 'adventure-sports', name: 'Adventure Sports' },
    { id: 'gym-workouts', name: 'Gym Workouts' },
    { id: 'hiking', name: 'Hiking' },
    { id: 'martial-arts', name: 'Martial Arts' }
  ],
  'Social Causes': [
    { id: 'activism', name: 'Activism' },
    { id: 'animal-rescue', name: 'Animal Rescue' },
    { id: 'environmental-conservation', name: 'Environmental Conservation' },
    { id: 'mental-health-awareness', name: 'Mental Health Awareness' }
  ],
  'Technology': [
    { id: 'blogging', name: 'Blogging' },
    { id: 'gadgets', name: 'Gadgets' },
    { id: 'networking', name: 'Networking' }
  ]
};

// Common languages for autocomplete
const commonLanguages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Russian', 'Japanese', 'Korean', 'Chinese', 'Arabic', 'Hindi', 
  'Bengali', 'Dutch', 'Greek', 'Turkish', 'Vietnamese', 'Thai'
];

const proficiencyLevels = [
  { value: 20, label: 'Beginner', icon: <Star className="h-4 w-4" /> },
  { value: 40, label: 'Elementary', icon: <Star className="h-4 w-4" /> },
  { value: 60, label: 'Intermediate', icon: <Star className="h-4 w-4" /> },
  { value: 80, label: 'Advanced', icon: <Star className="h-4 w-4" /> },
  { value: 100, label: 'Native/Fluent', icon: <Star className="h-4 w-4" /> }
];

interface ProfileCompletionTip {
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<{ language_id: string; proficiency: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [incompleteSections, setIncompleteSections] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState('');
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([]);
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [customInterests, setCustomInterests] = useState<Interest[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [hoveredInterest, setHoveredInterest] = useState<string | null>(null);
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showProfileTips, setShowProfileTips] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvatarUrl, setShowAvatarUrl] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [stickyTabs, setStickyTabs] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation controls
  const controls = useAnimation();
  const progressControls = useAnimation();
  const tabsControls = useAnimation();
  const isInView = useInView(tabsRef, { once: false, margin: "-100px" });

  useEffect(() => {
    fetchProfile();
    fetchData();
  }, []);

  // Handle scroll for sticky tabs
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const tabsPosition = tabsRef.current.getBoundingClientRect().top;
        setStickyTabs(tabsPosition <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate progress bar when completeness changes
  useEffect(() => {
    progressControls.start({
      width: `${profileCompleteness}%`,
      backgroundColor: profileCompleteness < 30 ? '#ef4444' : 
                       profileCompleteness < 70 ? '#f59e0b' : '#10b981',
      transition: { duration: 0.8, ease: "easeOut" }
    });
  }, [profileCompleteness, progressControls]);

  // Animate tabs when they become sticky
  useEffect(() => {
    if (stickyTabs) {
      tabsControls.start({
        y: 0,
        opacity: 1,
        transition: { duration: 0.3 }
      });
    } else {
      tabsControls.start({
        y: -10,
        opacity: 0.8,
        transition: { duration: 0.3 }
      });
    }
  }, [stickyTabs, tabsControls]);

  const fetchData = async () => {
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
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error. Please log in again.');
      }
      if (!session?.user) {
        console.error('No authenticated user');
        throw new Error('No authenticated user. Please log in.');
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          university:universities(id, name),
          campus:campuses(id, name)
        `)
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user's interests
      const { data: userInterests, error: interestsError } = await supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', session.user.id);

      if (interestsError) throw interestsError;

      // Initialize selectedInterests with the user's current interests
      setSelectedInterests(userInterests?.map(i => i.interest_id) || []);

      // Fetch user's languages
      const { data: userLanguages, error: languagesError } = await supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', session.user.id);
        
      if (languagesError) {
        console.error('Languages fetch error:', languagesError);
        // Continue with empty languages array instead of failing completely
      }

      setProfile({
        ...profileData,
        languages: userLanguages?.map(lang => ({
          language_id: lang.language_id,
          proficiency: lang.proficiency
        })) || [],
        interests: userInterests?.map(i => i.interest_id) || [],
        university: profileData.university,
        campus: profileData.campus
      });

      setSelectedLanguages(userLanguages || []);

      if (profileData.campus_id) {
        const { data: campusesData, error: campusesError } = await supabase
          .from('campuses')
          .select('*')
          .eq('university_id', profileData.university_id);
          
        if (campusesError) {
          console.error('Campuses fetch error:', campusesError);
          // Continue without campuses data
        } else if (campusesData) {
          setCampuses(campusesData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message || 'Failed to load profile');
      
      // Show error toast with specific message
      toast({
        title: "Profile Load Error",
        description: error.message || "There was an error loading your profile. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch campuses for a university
  const fetchCampuses = async (universityId: string) => {
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .eq('university_id', universityId)
        .order('name');

      if (error) throw error;
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast({
        title: "Error",
        description: "Failed to load campuses. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the university selection handler
  const handleUniversityChange = async (universityId: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, university_id: universityId, campus_id: null } : null);
      setHasChanges(true);
      await fetchCampuses(universityId);
    }
  };

  // Update the campus selection handler
  const handleCampusChange = (campusId: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, campus_id: campusId } : null);
      setHasChanges(true);
    }
  };

  // Update the major selection handler
  const handleMajorChange = (majorId: string) => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, major_id: majorId } : null);
      setHasChanges(true);
    }
  };

  // Update the year of study handler
  const handleYearOfStudyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    if (profile) {
      setProfile(prev => prev ? { ...prev, year_of_study: value } : null);
      setHasChanges(true);
    }
  };

  // Update the student type handler
  const handleStudentTypeChange = (type: 'international' | 'local') => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, student_type: type } : null);
      setHasChanges(true);
    }
  };

  // Update the academic form section
  const renderAcademicForm = () => (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Select
            value={profile?.university_id || ''}
            onValueChange={handleUniversityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select university" />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campus">Campus</Label>
          <Select
            value={profile?.campus_id || ''}
            onValueChange={handleCampusChange}
            disabled={!profile?.university_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campus" />
            </SelectTrigger>
            <SelectContent>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="major">Major</Label>
          <Select
            value={profile?.major_id || ''}
            onValueChange={handleMajorChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select major" />
            </SelectTrigger>
            <SelectContent>
              {majors.map((major) => (
                <SelectItem key={major.id} value={major.id}>
                  {major.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year_of_study">Year of Study</Label>
          <Input
            id="year_of_study"
            type="number"
            min="1"
            max="10"
            value={profile?.year_of_study || ''}
            onChange={handleYearOfStudyChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Student Type</Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={profile?.student_type === 'international' ? 'default' : 'outline'}
              onClick={() => handleStudentTypeChange('international')}
            >
              International
            </Button>
            <Button
              type="button"
              variant={profile?.student_type === 'local' ? 'default' : 'outline'}
              onClick={() => handleStudentTypeChange('local')}
            >
              Local
            </Button>
          </div>
        </div>
      </div>
    </form>
  );

  // Update the useEffect to fetch campuses when university changes
  useEffect(() => {
    if (profile?.university_id) {
      fetchCampuses(profile.university_id);
    }
  }, [profile?.university_id]);

  // Update the debouncedSave function to include academic fields
  const debouncedSave = useCallback(
    debounce(async (profileData: Profile, languages: any[], interests: string[]) => {
      if (!profileData) return;
      
      try {
        setSaving(true);
        setError(null);

        // Update profile in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            bio: profileData.bio,
            nationality: profileData.nationality,
            year_of_study: profileData.year_of_study,
            university_id: profileData.university_id,
            campus_id: profileData.campus_id,
            major_id: profileData.major_id,
            student_type: profileData.student_type,
            cultural_insight: profileData.cultural_insight,
            location: profileData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileData.id);

        if (profileError) throw profileError;

        // Update languages in Supabase
        const { error: deleteLanguagesError } = await supabase
          .from('user_languages')
          .delete()
          .eq('user_id', profileData.id);
        
        if (deleteLanguagesError) throw deleteLanguagesError;

        if (languages.length > 0) {
          const { error: insertLanguagesError } = await supabase
            .from('user_languages')
            .insert(languages.map(lang => ({
              user_id: profileData.id,
              language_id: lang.language_id,
              proficiency: lang.proficiency
            })));

          if (insertLanguagesError) throw insertLanguagesError;
        }

        // Update interests
        const { error: deleteInterestsError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', profileData.id);
        
        if (deleteInterestsError) throw deleteInterestsError;

        if (interests.length > 0) {
          // Get the actual interest IDs from the database
          const { data: interestData, error: interestError } = await supabase
            .from('interests')
            .select('id, name')
            .in('name', interests);

          if (interestError) throw interestError;

          const interestIds = interestData?.map(i => i.id) || [];

          if (interestIds.length > 0) {
            const { error: insertInterestsError } = await supabase
              .from('user_interests')
              .insert(interestIds.map(interestId => ({
                user_id: profileData.id,
                interest_id: interestId
              })));

            if (insertInterestsError) throw insertInterestsError;
          }
        }

        setSuccess('Profile updated successfully');
        setHasChanges(false);
        
        // Show success toast
        toast({
          title: "Profile Updated",
          description: "Your profile has been automatically saved.",
          duration: 2000,
        });

        // Notify about the update
        await notifyProfileUpdate(profileData.id);
        await notifyInterestUpdate(profileData.id, interests);
        await notifyAcademicUpdate(profileData.id, ['Academic information']);
      } catch (error: any) {
        console.error('Error updating profile:', error);
        setError(error.message);
        
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setSaving(false);
      }
    }, 1000),
    []
  );

  // Update useEffect to trigger autosave
  useEffect(() => {
    if (profile && hasChanges) {
      debouncedSave(profile, selectedLanguages, selectedInterests);
    }
  }, [profile, selectedLanguages, selectedInterests, hasChanges, debouncedSave]);

  // Update handleInputChange to trigger autosave
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile(prev => prev ? { ...prev, [name]: value } : null);
      setHasChanges(true);
    }
  };

  // Update handleInterestToggle to work with interest names
  const handleInterestToggle = useCallback((interestName: string, checked: boolean) => {
    setSelectedInterests(prev => {
      if ((prev.includes(interestName) && checked) || (!prev.includes(interestName) && !checked)) {
        return prev;
      }
      
      const newSelectedInterests = checked
        ? [...prev, interestName]
        : prev.filter(name => name !== interestName);

      if (profile) {
        setProfile(prev => prev ? {
          ...prev,
          interests: newSelectedInterests
        } : null);
      }

      return newSelectedInterests;
    });
    
    setHasChanges(true);
  }, [profile]);

  // Enhanced profile completeness calculation
  useEffect(() => {
    if (!profile) return;
    
    const sections = [
      { name: "Basic Info", weight: 20, complete: !!(profile.first_name && profile.last_name && profile.nationality) },
      { name: "Bio", weight: 15, complete: !!profile.bio },
      { name: "Cultural Insight", weight: 15, complete: !!profile.cultural_insight },
      { name: "Education", weight: 20, complete: !!(profile.university_id && profile.major_id && profile.year_of_study) },
      { name: "Languages", weight: 15, complete: profile.languages && profile.languages.length > 0 },
      { name: "Interests", weight: 15, complete: profile.interests && profile.interests.length > 0 }
    ];
    
    const incomplete = sections.filter(section => !section.complete).map(section => section.name);
    setIncompleteSections(incomplete);
    
    const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
    const completedWeight = sections.reduce((sum, section) => sum + (section.complete ? section.weight : 0), 0);
    
    const completeness = Math.round((completedWeight / totalWeight) * 100);
    setProfileCompleteness(completeness);
    setIsProfileComplete(completeness >= 90);
  }, [profile]);

  // Memoize the handleLanguageInputChange function
  const handleLanguageInputChange = useCallback((value: string) => {
    setNewLanguage(value);
    
    if (value.trim()) {
      const suggestions = languages
        .filter(lang => 
          lang.name.toLowerCase().includes(value.toLowerCase()) && 
          !selectedLanguages.some(l => l.language_id === lang.id)
        )
        .slice(0, 5);
      
      setLanguageSuggestions(suggestions.map(lang => lang.name));
      setShowLanguageSuggestions(suggestions.length > 0);
    } else {
      setLanguageSuggestions([]);
      setShowLanguageSuggestions(false);
    }
  }, [languages, selectedLanguages]);

  // Add a new language
  const handleAddLanguage = useCallback((languageId: string) => {
    if (profile) {
      const newLanguage = {
        language_id: languageId,
        proficiency: '60'
      };
      setProfile({
        ...profile,
        languages: [...(profile.languages || []), newLanguage]
      });
      setHasChanges(true);
    }
  }, [profile]);

  // Remove a language
  const handleRemoveLanguage = useCallback((languageId: string) => {
    if (profile) {
      setProfile({
        ...profile,
        languages: profile.languages?.filter(lang => lang.language_id !== languageId) || []
      });
      setHasChanges(true);
    }
  }, [profile]);

  // Handle proficiency change with slider
  const handleProficiencyChange = useCallback((languageId: string, value: number[]) => {
    if (profile) {
      setProfile({
        ...profile,
        languages: profile.languages?.map(lang => 
          lang.language_id === languageId 
            ? { ...lang, proficiency: value[0].toString() } 
            : lang
        ) || []
      });
      setHasChanges(true);
    }
  }, [profile]);

  // Get proficiency label based on value
  const getProficiencyLabel = (value: number) => {
    if (value < 20) return 'Beginner';
    if (value < 40) return 'Elementary';
    if (value < 60) return 'Intermediate';
    if (value < 80) return 'Advanced';
    return 'Native/Fluent';
  };

  // Add a custom interest
  const handleAddCustomInterest = useCallback(() => {
    if (newInterest.trim() && profile) {
      setProfile({
        ...profile,
        interests: [...(profile.interests || []), newInterest.trim()]
      });
      setNewInterest('');
      setShowInterestInput(false);
      setHasChanges(true);
    }
  }, [newInterest, profile]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Copy avatar URL to clipboard
  const copyAvatarUrl = () => {
    if (profile?.avatar_url) {
      navigator.clipboard.writeText(profile.avatar_url);
      toast({
        title: "URL Copied",
        description: "Avatar URL copied to clipboard",
        duration: 2000,
      });
    }
  };

  // Memoize the filtered interests based on search term
  const filteredInterests = useMemo(() => {
    if (!searchTerm) return interestCategories;
    
    return Object.entries(interestCategories).reduce((acc, [category, categoryInterests]) => {
      const filtered = categoryInterests.filter(interest => 
        interest.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {} as Record<string, Interest[]>);
  }, [searchTerm]);

  const tipVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Memoize the profile completion tips
  const profileCompletionTips = useMemo(() => {
    if (!profile) return [];
    
    return [
      {
        title: "Personal Information",
        description: "Add your name, nationality, and bio to help others get to know you.",
        icon: <User className="h-5 w-5" />,
        completed: !!(profile.first_name && profile.last_name && profile.nationality)
      },
      {
        title: "Academic Details",
        description: "Specify your university, major, and year of study to connect with peers.",
        icon: <GraduationCap className="h-5 w-5" />,
        completed: !!(profile.university_id && profile.major_id && profile.year_of_study)
      },
      {
        title: "Languages",
        description: "Add languages you speak to connect with international students.",
        icon: <Languages className="h-5 w-5" />,
        completed: profile.languages && profile.languages.length > 0
      },
      {
        title: "Interests",
        description: "Share your interests to find like-minded students.",
        icon: <Heart className="h-5 w-5" />,
        completed: profile.interests && profile.interests.length > 0
      }
    ];
  }, [profile]);

  // Calculate profile completion percentage
  const completionPercentage = Math.round(
    (profileCompletionTips.filter(tip => tip.completed).length / profileCompletionTips.length) * 100
  );

  // Memoize the getLanguageName function
  const getLanguageName = useCallback((languageId: string) => {
    const language = languages.find(l => l.id === languageId);
    return language?.name || languageId;
  }, [languages]);

  // Memoize the getInterestName function
  const getInterestName = useCallback((interestId: string) => {
    const interest = interests.find(i => i.id === interestId);
    return interest?.name || interestId;
  }, [interests]);

  // Add back the handleAvatarUpdated function that was accidentally removed
  const handleAvatarUpdated = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
      setHasChanges(true);
      
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
        duration: 3000,
      });
    }
  };

  // Add back the handleNumberInputChange function
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profile) {
      setProfile({ ...profile, [name]: value ? parseInt(value) : null });
      setHasChanges(true);
    }
  };

  // Add back the handleLanguageChange function
  const handleLanguageChange = (languageId: string, proficiency: string) => {
    const existingLanguage = selectedLanguages.find(l => l.language_id === languageId);
    if (existingLanguage) {
      setSelectedLanguages(selectedLanguages.map(l => 
        l.language_id === languageId ? { ...l, proficiency } : l
      ));
    } else {
      setSelectedLanguages([...selectedLanguages, { language_id: languageId, proficiency }]);
    }
    setHasChanges(true);
  };

  // Update the interest rendering to use names
  const renderInterests = () => {
    return Object.entries(filteredInterests).map(([category, categoryInterests]) => (
      <div key={category} className="space-y-4">
        <h3 className="text-lg font-medium">{category}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categoryInterests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.name);
            return (
              <div
                key={interest.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInterestToggle(interest.name, !isSelected)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="font-medium">{interest.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>Profile not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="bg-white p-8 rounded-lg shadow-lg text-center"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Profile Updated!</h2>
              <p className="text-gray-600">Your changes have been saved successfully.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading profile" />
        </div>
      ) : !profile ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>
            {error || "We couldn't find your profile. Please try again later."}
          </AlertDescription>
        </Alert>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="relative">
              <ProfileAvatar 
                userId={profile.id} 
                onAvatarUpdated={handleAvatarUpdated}
                size="lg"
                showCard={false}
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  {profile.nationality && (
                    <p className="text-muted-foreground">
                      {profile.nationality}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Profile Completeness
              </CardTitle>
              <CardDescription>
                Complete your profile to increase your visibility and connect with more students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Progress value={profileCompleteness} className="h-2" aria-label={`Profile completeness: ${profileCompleteness}%`} />
                  <span className="text-sm font-medium">{profileCompleteness}%</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileCompletionTips.map((tip, index) => (
                    <motion.div
                      key={index}
                      variants={tipVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                        tip.completed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className={`p-2 rounded-full ${
                          tip.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {tip.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{tip.title}</h3>
                          <p className="text-sm text-muted-foreground">{tip.description}</p>
                        </div>
                        {tip.completed && (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-auto" aria-hidden="true" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {incompleteSections.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Complete these sections to improve your profile:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {incompleteSections.map((section, index) => (
                        <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4" aria-label="Profile sections">
              <TabsTrigger value="personal" aria-controls="personal-content">
                Personal
              </TabsTrigger>
              <TabsTrigger value="academic" aria-controls="academic-content">
                Academic
              </TabsTrigger>
              <TabsTrigger value="languages" aria-controls="languages-content">
                Languages
              </TabsTrigger>
              <TabsTrigger value="interests" aria-controls="interests-content">
                Interests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" id="personal-content">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Tell others about yourself.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={profile.first_name || ''}
                          onChange={handleInputChange}
                          aria-required="true"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={profile.last_name || ''}
                          onChange={handleInputChange}
                          aria-required="true"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profile.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell others about yourself..."
                        className="min-h-[100px]"
                        aria-label="Your bio"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          name="nationality"
                          value={profile.nationality || ''}
                          onChange={handleInputChange}
                          aria-label="Your nationality"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={profile.location || ''}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                          aria-label="Your location"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cultural_insight">Cultural Insight</Label>
                      <Textarea
                        id="cultural_insight"
                        name="cultural_insight"
                        value={profile.cultural_insight || ''}
                        onChange={handleInputChange}
                        placeholder="Share your cultural background, traditions, or experiences..."
                        className="min-h-[100px]"
                        aria-label="Your cultural insights"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={saving || !hasChanges}
                        aria-label="Save profile changes"
                        aria-busy={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="academic" id="academic-content">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>
                    Tell others about your academic background.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAcademicForm()}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="languages" id="languages-content">
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                  <CardDescription>
                    Tell others about the languages you speak.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className="space-y-4">
                      {profile.languages.map((language) => {
                        const languageData = languages.find(l => l.id === language.language_id);
                        return (
                          <Badge
                            key={language.language_id}
                            variant="secondary"
                            className="px-3 py-1"
                          >
                            {languageData?.name || language.language_id}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveLanguage(language.language_id);
                              }}
                              className="ml-2 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search languages..."
                        value={newLanguage}
                        onChange={(e) => handleLanguageInputChange(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddLanguage(newLanguage);
                        }}
                        disabled={!newLanguage}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    {showLanguageSuggestions && (
                      <div className="border rounded-md p-2">
                        {languageSuggestions.map((lang) => (
                          <div
                            key={lang}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                            onClick={(e) => {
                              e.preventDefault();
                              setNewLanguage(lang);
                              setShowLanguageSuggestions(false);
                            }}
                          >
                            {lang}
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interests" id="interests-content">
              <Card>
                <CardHeader>
                  <CardTitle>Interests</CardTitle>
                  <CardDescription>
                    Tell others about your interests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className="space-y-4">
                      {renderInterests()}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}; 