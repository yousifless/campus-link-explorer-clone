
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardUser {
  id: string;
  rank: number;
  first_name: string;
  last_name: string;
  avatar_url: string;
  referral_count: number;
  campus_name: string;
}

interface ReferralLeaderboardProps {
  limit?: number;
  title?: string;
  description?: string;
}

const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({
  limit = 10,
  title = "Referral Leaderboard",
  description = "Top referrers this month"
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .rpc('get_referral_leaderboard', { limit_count: limit });
        
        if (error) {
          console.error('Error fetching leaderboard:', error);
          setError(error.message);
          return;
        }
        
        if (data) {
          // Add rank property to each user
          const rankedData = data.map((user: any, index: number) => ({
            ...user,
            rank: index + 1
          }));
          
          setLeaderboard(rankedData);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [limit]);
  
  // Trophy colors based on rank
  const getTrophyColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-amber-500';
      case 2:
        return 'text-slate-400';
      case 3:
        return 'text-amber-700';
      default:
        return 'text-gray-400';
    }
  };
  
  // Trophy sizes based on rank
  const getTrophySize = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-7 w-7';
      case 2:
      case 3:
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="ml-auto h-4 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {leaderboard.length > 0 ? (
          leaderboard.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 text-center">
                {user.rank <= 3 ? (
                  <Trophy className={`${getTrophyColor(user.rank)} ${getTrophySize(user.rank)} mx-auto`} />
                ) : (
                  <span className="text-sm font-medium text-gray-500">{user.rank}</span>
                )}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
                <AvatarFallback>
                  {user.first_name[0]}{user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.campus_name}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-semibold">{user.referral_count}</span>
                <span className="text-xs text-muted-foreground">
                  {user.referral_count === 1 ? 'referral' : 'referrals'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No referral data available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;
