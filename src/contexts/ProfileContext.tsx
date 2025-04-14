
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { ProfileType } from '@/types/database';

// Define a language interface to properly type the language objects
interface LanguageWithProficiency {
  id: string;
  name?: string;
  code?: string;
  proficiency?: string;
}

type ProfileContextType = {
  profile: ProfileType | null;
  loading: boolean;
  updateProfile: (updates: Partial<ProfileType>) => Promise<void>;
  fetchProfile: () => Promise<void>;
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

      // Fetch the user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      // Fetch user's interests - use maybeSingle to avoid errors when no results
      let interests: string[] = [];
      try {
        const { data: userInterestsData } = await supabase
          .from('user_interests')
          .select('interests(id, name)')
          .eq('user_id', user.id);
          
        interests = (userInterestsData || [])
          .map((i: any) => i.interests?.name)
          .filter(Boolean);
      } catch (interestsError) {
        console.error('Error fetching interests:', interestsError);
        // Continue despite error
      }

      // Fetch user's languages - use maybeSingle to avoid errors when no results
      let languages: string[] = [];
      try {
        const { data: userLanguagesData } = await supabase
          .from('user_languages')
          .select('languages(id, name, code), proficiency')
          .eq('user_id', user.id);
          
        languages = (userLanguagesData || [])
          .map((l: any) => l.languages?.name)
          .filter(Boolean);
      } catch (languagesError) {
        console.error('Error fetching languages:', languagesError);
        // Continue despite error
      }

      // Fetch university name if campus_id exists
      let universityName = null;
      if (data?.campus_id) {
        try {
          const { data: campusData, error: campusError } = await supabase
            .from('campuses')
            .select('universities(name)')
            .eq('id', data.campus_id)
            .single();
            
          if (!campusError && campusData && campusData.universities) {
            universityName = campusData.universities.name || null;
          }
        } catch (campusError) {
          console.error('Error fetching campus data:', campusError);
          // Continue even if we can't fetch the university name
        }
      }

      const studentType = data?.student_type === "international" || data?.student_type === "local" 
        ? data.student_type 
        : null;

      // Create a profile object with all necessary fields, including nickname and cultural_insight
      const profileData: ProfileType = {
        ...data,
        interests: interests,
        languages: languages,
        university: universityName,
        student_type: studentType,
        is_verified: data?.is_verified || false,
        nickname: data?.nickname || null,
        cultural_insight: data?.cultural_insight || null
      };

      setProfile(profileData);
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
      
      // Include nickname and cultural_insight in profile updates
      const { nickname, cultural_insight, ...otherUpdates } = profileUpdates;
      
      // Update profile with better error handling
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname,
          cultural_insight,
          ...otherUpdates
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Handle interest updates
      if (interests && Array.isArray(interests) && interests.length > 0) {
        await updateInterests(interests);
      }

      // Handle language updates
      if (languages && Array.isArray(languages) && languages.length > 0) {
        await updateLanguages(languages);
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Extracted the interest updating logic to a separate function
  const updateInterests = async (interests: string[]) => {
    try {
      // Delete existing interests first
      const { error: deleteError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user!.id);
      
      if (deleteError) throw deleteError;
      
      // Add a slight delay before the next operation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Batch insert interests to reduce API calls
      const interestBatches = [];
      const batchSize = 3;
      
      for (let i = 0; i < interests.length; i += batchSize) {
        const batch = interests.slice(i, i + batchSize)
          .filter(Boolean)
          .map(interestId => ({
            user_id: user!.id,
            interest_id: interestId
          }));
        
        if (batch.length > 0) {
          interestBatches.push(batch);
        }
      }
      
      // Insert batches with delay between them
      for (const batch of interestBatches) {
        await supabase.from('user_interests').insert(batch);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (interestError) {
      console.error('Error updating interests:', interestError);
      // Continue despite interest update errors
    }
  };

  // Extracted the language updating logic to a separate function
  const updateLanguages = async (languages: any[]) => {
    try {
      // Delete existing languages first
      const { error: deleteLangError } = await supabase
        .from('user_languages')
        .delete()
        .eq('user_id', user!.id);
      
      if (deleteLangError) throw deleteLangError;
      
      // Add a slight delay before the next operation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Batch insert languages to reduce API calls
      const languageBatches = [];
      const batchSize = 3;
      
      const validLanguages = languages
        .filter(lang => lang && typeof lang === 'object' && (lang as LanguageWithProficiency).id);
      
      for (let i = 0; i < validLanguages.length; i += batchSize) {
        const batch = validLanguages.slice(i, i + batchSize)
          .map(lang => {
            const langObj = lang as LanguageWithProficiency;
            return {
              user_id: user!.id,
              language_id: langObj.id,
              proficiency: langObj.proficiency || 'beginner'
            };
          });
        
        if (batch.length > 0) {
          languageBatches.push(batch);
        }
      }
      
      // Insert batches with delay between them
      for (const batch of languageBatches) {
        await supabase.from('user_languages').insert(batch);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (langError) {
      console.error('Error updating languages:', langError);
      // Continue despite language update errors
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
