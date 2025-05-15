import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/types/database';

// For production usage, you should implement proper environment variable handling
const OPENAI_API_KEY = 'your-openai-api-key'; // Replace with env variable in production
const OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Profile embedding service that handles generating, storing, and retrieving
 * text embeddings for user profiles using OpenAI's embedding API
 */
export class EmbeddingService {
  private static instance: EmbeddingService;
  private cache: Map<string, { embedding: number[]; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 hour cache 

  private constructor() {}

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Generate embedding for a given profile and store it
   */
  public async generateEmbedding(profile: ProfileType): Promise<number[] | null> {
    try {
      // Create a meaningful text representation of the profile
      const profileText = this.createProfileText(profile);
      
      // Get embedding from OpenAI
      const embedding = await this.getEmbeddingFromOpenAI(profileText);
      
      if (!embedding) {
        console.error('Failed to generate embedding for profile:', profile.id);
        return null;
      }
      
      // Store embedding in cache
      this.cache.set(profile.id, {
        embedding,
        timestamp: Date.now()
      });
      
      // Store embedding in database
      await this.saveEmbeddingToDatabase(profile.id, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Get embedding for a profile, using cache if available
   */
  public async getEmbedding(profileId: string): Promise<number[] | null> {
    // Check cache first
    const cached = this.cache.get(profileId);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.embedding;
    }
    
    // Try to get from database
    const { data, error } = await supabase
      .from('profile_embeddings')
      .select('embedding')
      .eq('user_id', profileId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Store in cache
    this.cache.set(profileId, {
      embedding: data.embedding,
      timestamp: Date.now()
    });
    
    return data.embedding;
  }

  /**
   * Get embeddings for multiple profiles at once
   */
  public async getEmbeddings(profileIds: string[]): Promise<Map<string, number[]>> {
    const embeddings = new Map<string, number[]>();
    
    // Check cache first for each profile
    const uncachedIds = profileIds.filter(id => {
      const cached = this.cache.get(id);
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        embeddings.set(id, cached.embedding);
        return false;
      }
      return true;
    });
    
    if (uncachedIds.length === 0) {
      return embeddings;
    }
    
    // Get remaining embeddings from database
    const { data, error } = await supabase
      .from('profile_embeddings')
      .select('user_id, embedding')
      .in('user_id', uncachedIds);
    
    if (error || !data) {
      console.error('Error fetching embeddings:', error);
      return embeddings;
    }
    
    // Add database results to cache and result map
    data.forEach(item => {
      this.cache.set(item.user_id, {
        embedding: item.embedding,
        timestamp: Date.now()
      });
      embeddings.set(item.user_id, item.embedding);
    });
    
    return embeddings;
  }

  /**
   * Find similar profiles using vector similarity search
   */
  public async findSimilarProfiles(
    profileId: string,
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<{ id: string; similarity: number }[]> {
    try {
      // Get the embedding for the target profile
      const embedding = await this.getEmbedding(profileId);
      
      if (!embedding) {
        console.error('Embedding not found for profile:', profileId);
        return [];
      }
      
      // Use pgvector to find similar profiles
      // Note: This requires the pgvector extension to be enabled in your Supabase instance
      const { data, error } = await supabase.rpc('match_profiles_by_embedding', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_limit: limit
      });
      
      if (error) {
        console.error('Error finding similar profiles:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error in findSimilarProfiles:', error);
      return [];
    }
  }

  /**
   * Create a meaningful text representation of a profile for embedding
   */
  private createProfileText(profile: ProfileType): string {
    const parts = [
      // Basic info
      profile.bio || '',
      profile.cultural_insight || '',
      
      // Interests and languages
      profile.interests ? `Interests: ${profile.interests.join(', ')}` : '',
      profile.languages ? `Languages: ${profile.languages.map(l => l.id).join(', ')}` : '',
      
      // Education
      profile.major_id ? `Major: ${profile.major_id}` : '',
      profile.university_id ? `University: ${profile.university_id}` : '',
      profile.campus_id ? `Campus: ${profile.campus_id}` : '',
      
      // Other
      profile.nationality ? `Nationality: ${profile.nationality}` : '',
      profile.student_type ? `Student type: ${profile.student_type}` : ''
    ];
    
    return parts.filter(Boolean).join('. ');
  }

  /**
   * Call OpenAI API to get embedding
   */
  private async getEmbeddingFromOpenAI(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          model: EMBEDDING_MODEL
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        return null;
      }
      
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return null;
    }
  }

  /**
   * Save embedding to database
   */
  private async saveEmbeddingToDatabase(userId: string, embedding: number[]): Promise<void> {
    const { error } = await supabase
      .from('profile_embeddings')
      .upsert({
        user_id: userId,
        embedding,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving embedding to database:', error);
    }
  }
} 