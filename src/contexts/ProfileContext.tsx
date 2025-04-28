import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { ProfileType } from '@/types/database';

// Define a language interface to properly type the language objects
interface LanguageWithProficiency {
  id: string;
  proficiency: string;
}

interface UniversityData {
  id: string;
  name: string;
}

interface CampusData {
  id: string;
  name: string;
}

type ProfileContextType = {
  profile: ProfileType | null;
  loading: boolean;
  updateProfile: (updates: Partial<ProfileType>) => Promise<void>;
  fetchProfile: (force?: boolean) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_THROTTLE_MS = 10000; // 10 seconds between fetches

  const fetchProfile = useCallback(async (force = false) => {
    try {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // If we've fetched recently and it's not forced, don't fetch again
      const now = Date.now();
      if (!force && (now - lastFetchTime < FETCH_THROTTLE_MS)) {
        return;
      }
      
      setLoading(true);
      setLastFetchTime(now);

      // Fetch the user's profile with related data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {        
        if (profileError.code === 'PGRST116') {  // This is the error code for "no rows found"
          console.warn("No profile found for user:", user.id);
          setProfile(null);
          return; 
        } else {
          console.error('Error fetching profile:', profileError);
          throw profileError; // Re-throw other errors
        }
      }

      // Fetch university data if university_id exists
      let university = null;
      if (profileData?.university) {
        const { data: universityData } = await supabase
          .from('universities')
          .select('id, name')
          .eq('id', profileData.university)
          .single();
        
        if (universityData) {
          university = {
            id: universityData.id,
            name: universityData.name
          };
        }
      }

      // Fetch campus data if campus_id exists
      let campus = null;
      if (profileData?.campus_id) {
        const { data: campusData } = await supabase
          .from('campuses')
          .select('id, name')
          .eq('id', profileData.campus_id)
          .single();
        
        if (campusData) {
          campus = {
            id: campusData.id,
            name: campusData.name
          };
        }
      }

      // Fetch user's interests with IDs
      let interests: string[] = [];
      try {
        const { data: userInterestsData } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', user.id);
        
        interests = (userInterestsData || []).map((i) => i.interest_id);
      } catch (interestsError) {
        console.error('Error fetching interests:', interestsError);
      }

      // Fetch user's languages with proficiency
      let languages: LanguageWithProficiency[] = [];
      try {
        const { data: userLanguagesData } = await supabase
          .from('user_languages')
          .select('language_id, proficiency')
          .eq('user_id', user.id);
        
        languages = (userLanguagesData || []).map((l) => ({
          id: l.language_id,
          proficiency: l.proficiency,
        }));
      } catch (languagesError) {
        console.error('Error fetching languages:', languagesError);
      }

      const studentType =
        profileData?.student_type === "international" || profileData?.student_type === "local"
          ? profileData.student_type
          : null;

      // Create a profile object with all necessary fields
      const profile: ProfileType = {
        id: profileData.id,
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
        nickname: profileData?.nickname || null,
        bio: profileData?.bio || null,
        nationality: profileData?.nationality || null,
        year_of_study: profileData?.year_of_study || null,
        university_id: profileData?.university_id || null,
        campus_id: profileData?.campus_id || null,
        major_id: profileData?.major_id || null,
        student_type: studentType as 'international' | 'local' | null,
        cultural_insight: profileData?.cultural_insight || null,
        location: profileData?.location || null,
        avatar_url: profileData?.avatar_url || null,
        is_verified: profileData?.is_verified || false,
        created_at: profileData?.created_at || new Date().toISOString(),
        updated_at: profileData?.updated_at || new Date().toISOString(),
        interests: interests || [],
        languages: languages.map(lang => ({
          id: lang.id,
          proficiency: lang.proficiency || 'intermediate'
        })) || [],
        university: university || null,
        campus: campus || null
      };

      setProfile(profile);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, lastFetchTime]);

  const updateProfile = async (updates: Partial<ProfileType>) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");
      
      const { interests, languages, ...profileUpdates } = updates;
      
      // Ensure that only allowed fields are being updated to prevent errors.
      const allowedFields = [
        'nickname',
        'cultural_insight',
        'university_id',
        'campus_id',
        'major_id',
        'student_type',
        'nationality',
        'year_of_study',
        'first_name',
        'last_name',
        'bio',
        'location',
        'avatar_url',
      ];
      const filteredUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([key]) => allowedFields.includes(key))
      );

      // Update profile
      console.log('Sending updates to Supabase:', filteredUpdates);
      const { error: profileError } = await supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update interests if provided
      if (interests !== undefined) {
        // Delete existing interests
        const { error: deleteInterestsError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteInterestsError) throw deleteInterestsError;

        // Insert new interests
        if (interests.length > 0) {
          const interestInserts = interests.map(interestId => ({
            user_id: user.id,
            interest_id: interestId
          }));

          const { error: insertInterestsError } = await supabase
            .from('user_interests')
            .insert(interestInserts);

          if (insertInterestsError) throw insertInterestsError;
        }
      }

      // Update languages if provided
      if (languages !== undefined) {
        // Delete existing languages
        const { error: deleteLanguagesError } = await supabase
          .from('user_languages')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteLanguagesError) throw deleteLanguagesError;

        // Insert new languages
        if (languages.length > 0) {
          const languageInserts = languages.map(lang => ({
            user_id: user.id,
            language_id: lang.id,
            proficiency: lang.proficiency
          }));

          const { error: insertLanguagesError } = await supabase
            .from('user_languages')
            .insert(languageInserts);

          if (insertLanguagesError) throw insertLanguagesError;
        }
      }

      // Refresh profile data to show the updated profile
      await fetchProfile(true);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  const value = {
    profile,
    loading,
    updateProfile,
    fetchProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export type { ProfileType };
