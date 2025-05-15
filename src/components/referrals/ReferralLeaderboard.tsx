import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  referral_count: number;
  rank: number;
  campus_name?: string;
  highest_badge?: {
    name: string;
    color: string;
  };
}

interface ReferralLeaderboardProps {
  limit?: number;
  showCampus?: boolean;
  title?: string;
  description?: string;
}

const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({
  limit = 10,
  showCampus = false,
  title = "Referral Leaderboard",
  description = "Top referrers this month"
}) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Get the top referrers
        const { data, error } = await supabase
          .rpc('get_referral_leaderboard', { 
            limit_count: limit,
            include_campus: showCampus
          });
          
        if (error) throw error;
        
        // Process the data and add ranks
        const setLeaderboardData = (data: any[]) => {
          setLeaderboard(
            data.map((item) => {
              // Cast the item to an object with known properties
              const typedItem = item as unknown as { 
                id: string; 
                first_name: string; 
                last_name: string;
                avatar_url: string;
                referral_count: number;
                campus_name: string | null;
              };
              
              return typedItem;
            })
          );
        };
        
        setLeaderboardData(data);
        
        // If user is logged in, get their rank if not in top N
        if (user && !leaderboard.some(item => item.id === user.id)) {
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_referral_rank', { 
              user_id: user.id,
              include_campus: showCampus
            });
            
          if (!userError && userData) {
            setUserRank({
              ...userData,
              highest_badge: getBadgeFromCount(userData.referral_count)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [user, limit, showCampus]);
  
  // Helper to determine the highest badge based on referral count
  const getBadgeFromCount = (count: number): { name: string; color: string } => {
    if (count >= 25) return { name: 'Platinum Ambassador', color: 'bg-blue-200 text-blue-800' };
    if (count >= 10) return { name: 'Gold Ambassador', color: 'bg-amber-200 text-amber-800' };
    if (count >= 5) return { name: 'Silver Ambassador', color: 'bg-slate-200 text-slate-800' };
    if (count >= 1) return { name: 'Bronze Ambassador', color: 'bg-orange-200 text-orange-800' };
    return { name: 'Newcomer', color: 'bg-gray-200 text-gray-800' };
  };
  
  // Get medal icon based on rank
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted-foreground">No referrals yet. Be the first!</p>
            </div>
          ) : (
            <>
              {leaderboard.map((leader) => (
                <div 
                  key={leader.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    leader.id === user?.id ? 'bg-primary/10 border border-primary/20' : 'border'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 text-center mr-3">
                      {getMedalIcon(leader.rank)}
                    </div>
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={leader.avatar_url || undefined} />
                      <AvatarFallback>
                        {leader.first_name[0]}{leader.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {leader.first_name} {leader.last_name}
                        {leader.id === user?.id && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </p>
                      {showCampus && leader.campus_name && (
                        <p className="text-xs text-muted-foreground">
                          {leader.campus_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {leader.highest_badge && (
                      <Badge className={leader.highest_badge.color} variant="outline">
                        {leader.highest_badge.name}
                      </Badge>
                    )}
                    <span className="font-semibold">
                      {leader.referral_count} {leader.referral_count === 1 ? 'referral' : 'referrals'}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Show current user if not in top N */}
              {userRank && !leaderboard.some(item => item.id === user?.id) && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-2 text-xs text-muted-foreground">
                        {userRank.rank - leaderboard[leaderboard.length - 1].rank > 1 
                          ? `${userRank.rank - leaderboard[leaderboard.length - 1].rank - 1} more users...` 
                          : ''
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 text-center mr-3">
                        <span className="text-sm font-semibold text-muted-foreground">{userRank.rank}</span>
                      </div>
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={userRank.avatar_url || undefined} />
                        <AvatarFallback>
                          {userRank.first_name[0]}{userRank.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {userRank.first_name} {userRank.last_name}
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        </p>
                        {showCampus && userRank.campus_name && (
                          <p className="text-xs text-muted-foreground">
                            {userRank.campus_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {userRank.highest_badge && (
                        <Badge className={userRank.highest_badge.color} variant="outline">
                          {userRank.highest_badge.name}
                        </Badge>
                      )}
                      <span className="font-semibold">
                        {userRank.referral_count} {userRank.referral_count === 1 ? 'referral' : 'referrals'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;
