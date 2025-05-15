import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralBadge } from '@/types/referrals';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Award, Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface UserBadgesProps {
  userId?: string; // Optional: to view another user's badges
  limit?: number; // Optional: to limit the number of badges shown
  showViewAll?: boolean; // Optional: to show the "View All" button
  className?: string;
}

const UserBadges: React.FC<UserBadgesProps> = ({ 
  userId,
  limit = 4,
  showViewAll = true,
  className
}) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<ReferralBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const targetUserId = userId || user?.id;
  
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchBadges = async () => {
      try {
        setLoading(true);
        
        // Get user badges
        const { data: userBadges, error } = await supabase
          .from('user_badges')
          .select(`
            badge_id,
            earned_at,
            referral_badges (
              id,
              name,
              description,
              required_referrals,
              image_url
            )
          `)
          .eq('user_id', targetUserId)
          .order('earned_at', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        // Transform data to match ReferralBadge type
        const badgesData: ReferralBadge[] = userBadges.map(item => ({
          id: item.referral_badges.id,
          name: item.referral_badges.name,
          description: item.referral_badges.description,
          required_referrals: item.referral_badges.required_referrals,
          image_url: item.referral_badges.image_url,
          earned_at: item.earned_at
        }));
        
        // Fix the type issue by casting the id to number
        setBadges(badgesData.map(badge => ({
          ...badge,
          id: Number(badge.id) // Convert string id to number
        })) as ReferralBadge[]);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, [targetUserId, limit]);
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Badges
          </CardTitle>
          <CardDescription>Achievements unlocked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 mt-2" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (badges.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            Badges
          </CardTitle>
          <CardDescription>Achievements unlocked</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No badges earned yet</p>
          {showViewAll && targetUserId === user?.id && (
            <Button variant="link" asChild className="mt-2">
              <Link to="/referrals">
                <Gift className="h-4 w-4 mr-1" />
                Join the referral program
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Badge background colors
  const getBadgeColor = (badgeName: string): string => {
    if (badgeName.includes('Platinum')) return 'bg-blue-100 text-blue-800';
    if (badgeName.includes('Gold')) return 'bg-amber-100 text-amber-800';
    if (badgeName.includes('Silver')) return 'bg-slate-100 text-slate-800';
    if (badgeName.includes('Bronze')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Badge icon
  const getBadgeIcon = (badgeName: string): React.ReactNode => {
    if (badgeName.includes('Platinum')) return '💎';
    if (badgeName.includes('Gold')) return '🥇';
    if (badgeName.includes('Silver')) return '🥈';
    if (badgeName.includes('Bronze')) return '🥉';
    return '🏆';
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Award className="h-5 w-5 mr-2 text-primary" />
          Badges
        </CardTitle>
        <CardDescription>Achievements unlocked</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className="flex flex-col items-center text-center p-2 rounded-lg transition-colors hover:bg-muted/50"
            >
              <div 
                className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${getBadgeColor(badge.name)}`}
              >
                <span className="text-xl">{getBadgeIcon(badge.name)}</span>
              </div>
              <h4 className="font-medium text-sm">{badge.name}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
        
        {showViewAll && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild size="sm">
              <Link to="/referrals">
                <ExternalLink className="h-4 w-4 mr-1" />
                View All Badges
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserBadges;
