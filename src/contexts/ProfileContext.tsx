
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, db } from '@/integrations/supabase/enhanced-client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { ProfileType } from '@/types/database';
import { convertToLanguages, convertToInterests, convertToMajors, convertToUniversities, convertToCampuses } from '@/utils/dataConverters';

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

      const { data, error } = await db.profiles()
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Fetch user interests
      const { data: userInterestsData, error: interestsError } = await db.user_interests()
        .select('interests(id, name)')
        .eq('user_id', user.id);

      if (interestsError) throw interestsError;

      // Fetch user languages
      const { data: userLanguagesData, error: languagesError } = await db.user_languages()
        .select('languages(id, name, code), proficiency')
        .eq('user_id', user.id);

      if (languagesError) throw languagesError;

      // Extract interests data
      const interests = userInterestsData?.map((i: any) => 
        i.interests?.name || ''
      ).filter(Boolean) || [];
      
      // Format languages
      const languages = userLanguagesData?.map((l: any) => ({
        name: l.languages?.name || '',
        code: l.languages?.code || '',
        proficiency: l.proficiency || ''
      })) || [];

      // Get university name if a campus is selected
      let universityName = null;
      if (data?.campus_id) {
        const { data: campusData, error: campusError } = await db.campuses()
          .select('universities(name)')
          .eq('id', data.campus_id)
          .single();
          
        if (!campusError && campusData && campusData.universities) {
          universityName = campusData.universities.name || null;
        }
      }

      setProfile({
        ...data,
        interests,
        languages,
        university: universityName,
        is_verified: data?.is_verified || false
      });
    } catch (error: any) {
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
      
      // Only update the core profile fields
      const { interests, languages, ...profileUpdates } = updates;
      
      // Update profile
      const { error } = await db.profiles()
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) throw error;

      // Update interests if provided
      if (interests && interests.length > 0) {
        // First, delete existing interests
        await db.user_interests()
          .delete()
          .eq('user_id', user.id);

        // Then, add new interests
        for (const interestId of interests) {
          if (interestId) {
            await db.user_interests()
              .insert({ 
                user_id: user.id, 
                interest_id: interestId 
              });
          }
        }
      }

      // Update languages if provided
      if (languages && languages.length > 0) {
        // First, delete existing languages
        await db.user_languages()
          .delete()
          .eq('user_id', user.id);

        // Then, add new languages
        for (const lang of languages) {
          if (lang && typeof lang === 'object' && 'id' in lang && 'proficiency' in lang) {
            await db.user_languages()
              .insert({ 
                user_id: user.id, 
                language_id: lang.id,
                proficiency: lang.proficiency 
              });
          }
        }
      }

      await fetchProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
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
