# CampusLink Clubs & Group Meetups Implementation Plan

## Overview

This feature will allow students to form and join clubs based on shared courses or interests, schedule multi-person meetups, and engage with other members in a group setting, while preserving the existing one-on-one matching functionality.

## Implementation Phases

### Phase 1: Database Setup (Week 1)

1. **Create Database Schema**
   - Create required tables (`clubs`, `club_memberships`, `club_meetups`, `club_meetup_rsvps`)
   - Add foreign key relationships
   - Set up row-level security policies
   - Create necessary indexes for performance optimization

2. **Migration Script**
   - Write the SQL migration file for Supabase
   - Test migration on a development branch
   - Apply to production

### Phase 2: Backend API Development (Week 2)

1. **Create API Endpoints**
   - Club CRUD operations
   - Membership management
   - Meetup scheduling and RSVPs
   - Real-time chat functionality

2. **Develop Business Logic**
   - Authorization checks
   - Join code generation for private clubs
   - Recommendation algorithms for club discovery
   - Notification system for club events

### Phase 3: Frontend Core Components (Weeks 3-4)

1. **Create Core UI Components**
   - ClubCard.tsx
   - ClubDetail.tsx
   - ClubList.tsx
   - NewClub.tsx and EditClub.tsx
   - ClubMembersList.tsx
   - ClubChat.tsx

2. **Develop React Hooks and Context**
   - useClubs() - fetch and manage clubs
   - useClub(clubId) - fetch specific club details
   - useClubChat(clubId) - real-time club chat
   - useClubMeetups(clubId) - manage meetups

### Phase 4: Frontend Pages and Flows (Weeks 5-6)

1. **Implement Main Pages**
   - ClubsListPage
   - ClubDetailPage
   - ClubEditPage
   - ClubMeetupsPage

2. **Create Modals and Forms**
   - NewClubMeetupModal
   - JoinClubModal
   - InviteMembersModal

3. **Integrate with Existing Features**
   - Add "Clubs" tab in main navigation
   - Show recommended clubs based on user interests in Matches page
   - Display upcoming club meetups in Dashboard

### Phase 5: Notifications and Real-time Features (Week 7)

1. **Implement Notifications**
   - New club creation notifications
   - Meetup invitation notifications
   - RSVP reminders
   - Chat notifications

2. **Real-time Updates**
   - Live member presence in club chat
   - Real-time meetup RSVPs
   - Club activity feed

### Phase 6: Testing and Refinement (Week 8)

1. **Testing**
   - Unit tests for components and hooks
   - Integration tests for full user flows
   - Performance testing with large data sets
   - Security testing for permissions

2. **Refinement**
   - UX improvements based on user feedback
   - Performance optimizations
   - Accessibility enhancements

## Technical Details

### Database Schema

```sql
-- Clubs
CREATE TABLE clubs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  description   text,
  tags          text[] DEFAULT '{}',
  course_code   text,               -- optional: affiliated course
  visibility    text DEFAULT 'public', -- 'public' or 'private'
  join_code     text,               -- for private clubs
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz DEFAULT now()
);

-- Club Memberships
CREATE TABLE club_memberships (
  club_id  uuid REFERENCES clubs(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role     text DEFAULT 'member', -- 'member' or 'admin'
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);

-- Club Group Meetups (Events)
CREATE TABLE club_meetups (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id      uuid REFERENCES clubs(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  date         date,
  time         text,
  location_name text,
  location_address text,
  location_lat float,
  location_lng float,
  created_by   uuid REFERENCES profiles(id),
  created_at   timestamptz DEFAULT now()
);

-- Club Meetup RSVPs
CREATE TABLE club_meetup_rsvps (
  meetup_id  uuid REFERENCES club_meetups(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status     text DEFAULT 'pending', -- 'pending','yes','no','maybe'
  responded_at timestamptz DEFAULT now(),
  PRIMARY KEY (meetup_id, user_id)
);

-- Club Chat Messages
CREATE TABLE club_messages (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id      uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sender_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### Row-Level Security Policies

```sql
-- Clubs RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Anyone can view public clubs
CREATE POLICY "Anyone can view public clubs"
  ON clubs FOR SELECT
  USING (visibility = 'public');

-- Members can view private clubs they belong to
CREATE POLICY "Members can view private clubs they belong to"
  ON clubs FOR SELECT
  USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.user_id = auth.uid()
    )
  );

-- Only creators and admins can update clubs
CREATE POLICY "Only creators and admins can update clubs"
  ON clubs FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = clubs.id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role = 'admin'
    )
  );

-- Similar policies for other tables...
```

### Frontend Components

#### ClubCard.tsx
```tsx
interface ClubCardProps {
  club: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    memberCount: number;
    nextMeetupDate?: string;
  };
  onJoin: (clubId: string) => Promise<void>;
}

export const ClubCard = ({ club, onJoin }: ClubCardProps) => {
  // Implementation details...
};
```

#### ClubDetail.tsx
```tsx
interface ClubDetailProps {
  clubId: string;
  onJoin?: () => void;
  onLeave?: () => void;
}

export const ClubDetail = ({ clubId, onJoin, onLeave }: ClubDetailProps) => {
  const { club, loading, error } = useClub(clubId);
  
  // Implementation details...
};
```

### React Hooks

#### useClubs.ts
```tsx
export const useClubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation details for fetching clubs the user is part of
  // and discovering new clubs
  
  const joinClub = async (clubId: string, joinCode?: string) => {
    // Implementation for joining a club
  };
  
  const leaveClub = async (clubId: string) => {
    // Implementation for leaving a club
  };
  
  return { clubs, userClubs, loading, error, joinClub, leaveClub };
};
```

### Page Routing Structure

```tsx
<Routes>
  {/* Existing routes */}
  
  {/* Club routes */}
  <Route path="/clubs" element={<ClubsListPage />} />
  <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
  <Route path="/clubs/:clubId/edit" element={<ClubEditPage />} />
  <Route path="/clubs/:clubId/meetups" element={<ClubMeetupsPage />} />
  <Route path="/clubs/:clubId/meetups/:meetupId" element={<ClubMeetupDetailPage />} />
</Routes>
```

## Integration Points

1. **Navigation**
   - Add "Clubs" tab in the main navigation bar
   - Integrate with existing user flow

2. **Dashboard**
   - Add "Your Clubs" section displaying user's clubs
   - Show upcoming club meetups in calendar view

3. **Profile**
   - Add clubs the user belongs to in profile
   - Allow setting club notification preferences

4. **Matching**
   - Suggest clubs based on user's interests
   - Allow creating clubs from match results

## Success Metrics

1. **User Engagement**
   - Number of clubs created
   - Average members per club
   - Meetup scheduling and attendance rates

2. **Retention**
   - Club activity over time
   - Return rate to club pages
   - Club chat activity

## Rollout Strategy

1. **Alpha Testing**
   - Internal team testing
   - Fix critical issues

2. **Beta Launch**
   - Launch to select universities
   - Collect feedback and make adjustments

3. **Full Release**
   - Roll out to all campuses
   - Monitor performance and user adoption

4. **Iteration**
   - Gather user feedback
   - Implement improvements
   - Add advanced features based on user needs

## Post-Launch Enhancements

1. **Club Resources**
   - File sharing
   - Link repositories
   - Study guides

2. **Advanced Scheduling**
   - Recurring meetups
   - Calendar integrations
   - Availability polling

3. **Club Analytics**
   - Engagement metrics for club admins
   - Member participation stats
   - Growth trends 