import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { requestManager } from './requestManager';
import { cache } from './cache';

type TableName = keyof Database['public']['Tables'];

/**
 * Generic helper function for fetching data with related profiles
 * @param tableName The name of the table to fetch from
 * @param profileIdField The field in the table that references a profile ID
 * @param query Additional query parameters
 * @returns Array of items with joined profile data
 */
export const fetchWithProfiles = async (
  tableName: TableName, 
  profileIdField: string, 
  query: Record<string, any> = {}
) => {
  try {
    // Create a cache key based on the table, field, and query
    const cacheKey = `${tableName}-${profileIdField}-${JSON.stringify(query)}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached data for ${cacheKey}`);
      return cachedData;
    }
    
    // Use request manager to fetch data
    return await requestManager.request(
      `fetch-${cacheKey}`,
      async () => {
        // Fetch main records
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .match(query);
          
        if (error) throw error;
        if (!data || data.length === 0) return [];
        
        // Get profile IDs
        const profileIds = [...new Set(data.map(item => item[profileIdField]))];
        
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', profileIds);
          
        if (profilesError) throw profilesError;
        
        // Create profile map
        const profileMap: Record<string, any> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }
        
        // Create placeholder profile function
        const createPlaceholderProfile = (userId: string) => ({
          id: userId,
          first_name: 'Unknown',
          last_name: 'User',
          avatar_url: null
        });
        
        // Join the data
        const result = data.map(item => ({
          ...item,
          profile: profileMap[item[profileIdField]] || createPlaceholderProfile(item[profileIdField])
        }));
        
        // Cache the result for 30 seconds
        cache.set(cacheKey, result, 30000);
        
        return result;
      }
    );
  } catch (error) {
    console.error(`Error fetching ${tableName} with profiles:`, error);
    throw error;
  }
};

/**
 * Helper function to fetch messages with sender profiles
 * @param conversationId The ID of the conversation
 * @returns Array of messages with sender profiles
 */
export const fetchMessagesWithProfiles = async (conversationId: string) => {
  return fetchWithProfiles(
    'messages', 
    'sender_id',
    { conversation_id: conversationId }
  );
}; 