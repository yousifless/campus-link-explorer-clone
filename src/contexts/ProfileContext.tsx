
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
        if (error.code === 'PGRST116') {  // This is the error code for "no rows found"
          console.warn("No profile found for user:", user.id);
          setProfile(null);
          return; 
        } else {
          console.error('Error fetching profile:', error);
          throw error; // Re-throw other errors
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

      // Fetch university and campus names
      let university: { id: string; name: string } | null = null;
      let campusName: string | null = null;

      if (data?.university_id) {
        try {
          const { data: universityData, error: universityError } = await supabase
            .from('universities')
            .select('name')
            .eq('id', data.university_id)
            .single();

          if (!universityError && universityData) {
            university = { id: universityData.id, name: universityData.name };
          }
        } catch (error) {
          console.error('Error fetching university name:', error);
        }
      }

      if (data?.campus_id) {
        try {
          const { data: campusData, error: campusError } = await supabase
            .from('campuses')
            .select('name')
            .eq('id', data.campus_id)
            .single();

          if (!campusError && campusData) {
            campusName = campusData.name;
          }
        } catch (error) {
          console.error('Error fetching campus name:', error);
        }
      }

      const studentType =
        data?.student_type === "international" || data?.student_type === "local"
          ? data.student_type
          : null;

      // Create a profile object with all necessary fields, including university and campus names
      const profileData: ProfileType = {
        ...data,
        campus_id: data?.campus_id, // Ensure campus_id is included
        ...data,
        interests: interests,
        languages: languages,
        university: university ? university.name : null,
        campus: campusName,
        student_type: studentType,
        is_verified: data?.is_verified || false,
        nickname: data?.nickname || null,
        cultural_insight: data?.cultural_insight || null,
      }

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
        'interests',
        'languages',
      ];
      const filteredUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([key]) => allowedFields.includes(key))
      );

      // Update profile
      console.log('Sending updates to Supabase:', filteredUpdates);
      const { error: profileError } = await supabase.from('profiles').update(filteredUpdates).eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update interests - Sequentially after profile update
      if (interests !== undefined) {
        await updateInterests(interests);
      }

      // Update languages - Sequentially after interests update
      if (languages !== undefined) {
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
        variant: "destructive",
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
