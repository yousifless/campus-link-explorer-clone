# Hybrid Matching System for CampusLink

## Overview

CampusLink's hybrid matching system combines semantic embeddings with rule-based scoring to provide highly relevant match recommendations. Users can adjust weights for different matching factors through an intuitive UI, ensuring transparency and control over the matching process.

## Features

- **Vector Embeddings**: Profiles are encoded using OpenAI's text-embedding-3-small model
- **Rule-Based Scoring**: Multiple factors are scored independently (0-1 scale)
- **Dynamic Weighting**: Users control importance of each factor
- **Realtime Updates**: Match results update immediately when preferences change
- **Visual Transparency**: Match score breakdown shows why users matched

## Architecture

### Database Structure

- **profile_embeddings**: Stores vector embeddings of user profiles
- **user_match_preferences**: Stores weight preferences for each user

### Matching Factors

1. **Location Score (0-1)**
   - Same campus: 1.0
   - Same university: 0.8
   - Nearby location (distance-based): 0.0-0.5

2. **Interest Similarity (0-1)**
   - Primarily semantic similarity via embeddings
   - Falls back to common interest counting when embeddings unavailable

3. **Language Compatibility (0-1)**
   - Ratio of shared languages to total unique languages

4. **Goals Alignment (0-1)**
   - Ratio of shared goals to total unique goals

5. **Availability Compatibility (0-1)**
   - Overlap in available time slots

6. **Personality Compatibility (0-1)**
   - Big Five traits compatibility
   - Type-based matching (MBTI etc.)

7. **Network Score (0-1)**
   - Common connections relative to total connections

### Matching Formula

```
final_score = 
  (weight_location * location_score) +
  (weight_interests * interest_similarity) +
  (weight_languages * language_score) +
  (weight_goals * goals_score) +
  (weight_availability * availability_score) +
  (weight_personality * personality_score) +
  (weight_network * network_score)
```

Where weights are normalized to sum to 1.

## Implementation Details

### Backend Components

- **EmbeddingService**: Generates and caches profile embeddings
- **UserPreferencesService**: Manages user preference weights
- **Hybrid Matching Algorithm**: Computes weighted scores

### Frontend Components

- **MatchingPreferences**: UI for adjusting factor weights
- **HybridMatchCard**: Displays match with score breakdown 
- **Matches Page**: Tab view for switching between hybrid and standard matching

## Setup Instructions

### Database Setup

1. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Create necessary tables:
   ```sql
   -- See migration files for complete SQL
   ```

3. Add HNSW vector index for performance:
   ```sql
   CREATE INDEX ON profile_embeddings USING hnsw (embedding vector_cosine_ops);
   ```

### Configuration

1. Set OpenAI API key in your environment
2. Adjust default weights if needed in `DEFAULT_WEIGHTS` constant

## Usage

1. Visit the Matches page
2. Select the "Smart Matching" tab
3. Use sliders to adjust importance of different factors
4. See matches update in real-time with score breakdowns
5. Click "View match details" to see full compatibility analysis

## Performance Considerations

- Embeddings are cached for 1 hour to minimize API calls
- Preference updates trigger optimized re-ranking, not full recomputation
- HNSW index ensures vector similarity queries run in sub-10ms

## Future Enhancements

- Machine learning reranking based on user interaction history
- Graph-based stable matching algorithm for mutual compatibility
- Collaborative filtering to enhance interest similarity
- Better availability matching with calendar integration 