
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;

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

      // Fetch user's interests with proper error handling
      const { data: userInterestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('interests(id, name)')
        .eq('user_id', user.id);

      if (interestsError) {
        console.error('Error fetching interests:', interestsError);
        throw interestsError;
      }

      // Fetch user's languages with proper error handling
      const { data: userLanguagesData, error: languagesError } = await supabase
        .from('user_languages')
        .select('languages(id, name, code), proficiency')
        .eq('user_id', user.id);

      if (languagesError) {
        console.error('Error fetching languages:', languagesError);
        throw languagesError;
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
        interests: userInterestsData?.map((i: any) => i.interests?.name || '').filter(Boolean) || [],
        languages: userLanguagesData?.map((l: any) => l.languages?.name || '') || [],
        university: universityName,
        student_type: studentType,
        is_verified: data?.is_verified || false,
        // Use type assertion to handle these fields
        nickname: (data as any)?.nickname || null,
        cultural_insight: (data as any)?.cultural_insight || null
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
  };

  const updateProfile = async (updates: Partial<ProfileType>) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");
      
      const { interests, languages, ...profileUpdates } = updates;
      
      // Update profile with better error handling
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Update interests if provided
      if (interests && Array.isArray(interests) && interests.length > 0) {
        try {
          // Delete existing interests first
          const { error: deleteError } = await supabase
            .from('user_interests')
            .delete()
            .eq('user_id', user.id);
          
          if (deleteError) throw deleteError;
          
          // Add a slight delay before the next operation
          await new Promise(resolve => setTimeout(resolve, 200));

          // Insert new interests one by one with delay
          for (const interestId of interests) {
            if (interestId) {
              await supabase
                .from('user_interests')
                .insert({ 
                  user_id: user.id, 
                  interest_id: interestId 
                });
              // Small delay between inserts to prevent resource exhaustion
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (interestError) {
          console.error('Error updating interests:', interestError);
          // Continue despite interest update errors
        }
      }

      // Update languages if provided
      if (languages && Array.isArray(languages) && languages.length > 0) {
        try {
          // Delete existing languages first
          const { error: deleteLangError } = await supabase
            .from('user_languages')
            .delete()
            .eq('user_id', user.id);
          
          if (deleteLangError) throw deleteLangError;
          
          // Add a slight delay before the next operation
          await new Promise(resolve => setTimeout(resolve, 200));

          // Insert new languages one by one with delay
          for (const lang of languages) {
            if (lang && typeof lang === 'object') {
              const langObj = lang as LanguageWithProficiency;
              
              if (langObj.id) {
                const proficiency = langObj.proficiency || 'beginner';
                
                await supabase
                  .from('user_languages')
                  .insert({ 
                    user_id: user.id, 
                    language_id: langObj.id,
                    proficiency: proficiency 
                  });
                // Small delay between inserts to prevent resource exhaustion
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
          }
        } catch (langError) {
          console.error('Error updating languages:', langError);
          // Continue despite language update errors
        }
      }

      // Refresh profile data to show the updated profile
      await fetchProfile();
      
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

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
