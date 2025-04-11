
import { University, Major, Campus, Language, Interest, UserLanguage } from '@/types/database';

/**
 * Safely converts API data to specific types with proper error handling
 */
export const convertToUniversities = (data: any[]): University[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id || '',
    name: item.name || '',
    location: item.location || '',
    type: item.type || ''
  }));
};

export const convertToMajors = (data: any[]): Major[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id || '',
    name: item.name || '',
    field_of_study: item.field_of_study || ''
  }));
};

export const convertToCampuses = (data: any[]): Campus[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id || '',
    university_id: item.university_id || '',
    name: item.name || '',
    address: item.address || ''
  }));
};

export const convertToLanguages = (data: any[]): Language[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id || '',
    name: item.name || '',
    code: item.code || ''
  }));
};

export const convertToInterests = (data: any[]): Interest[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    id: item.id || '',
    name: item.name || '',
    category: item.category || ''
  }));
};

export const convertToUserLanguages = (data: any[]): UserLanguage[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    language_id: item.language_id || '',
    proficiency: item.proficiency || 'beginner'
  }));
};

export const safeGetProperty = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};
