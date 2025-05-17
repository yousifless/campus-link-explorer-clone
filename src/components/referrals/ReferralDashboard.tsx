
import React, { useState } from 'react';
import { useReferrals } from '@/hooks/useReferrals';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Share2, 
  Copy, 
  Gift, 
  Users, 
  Trophy, 
  Ticket, 
  Award, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ReferredUser, ReferralBadge, DiscountCode } from '@/types/referrals';

const ReferralDashboard: React.FC = () => {
  const { 
    referralStats, 
    referralCode, 
    referralLink, 
    discountCodes, 
    loading,
    shareReferralLink,
    copyReferralCode
  } = useReferrals();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate progress to next badge
  const calculateProgress = () => {
    if (!referralStats || !referralStats.next_badge) return 100;
    
    const currentCount = referralStats.referral_count;
    const nextBadgeRequirement = referralStats.next_badge.required_referrals;
    const prevBadgeRequirement = referralStats.badges.length > 0 
      ? Math.max(...referralStats.badges.map(b => b.required_referrals))
      : 0;
    
    // Calculate progress percentage between previous badge and next badge
    const progressRange = nextBadgeRequirement - prevBadgeRequirement;
    const progressMade = currentCount - prevBadgeRequirement;
    
    return Math.min(100, Math.max(0, (progressMade / progressRange) * 100));
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="mr-2 h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends to CampusLink and earn rewards
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="referrals">Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <CardContent className="p-6 space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Your Referral Code</h3>
              <div className="flex gap-2">
                <Input 
                  value={referralCode || ''} 
                  readOnly 
                  className="font-mono"
                />
                <Button variant="outline" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4">
                <Button 
                  className="w-full"
                  onClick={shareReferralLink}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Referral Link
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="text-2xl font-bold">
                    {referralStats?.referral_count || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Friends Referred</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <h3 className="text-2xl font-bold">
                    {referralStats?.total_points || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Points Earned</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Ticket className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <h3 className="text-2xl font-bold">
                    {discountCodes?.filter(c => !c.used).length || 0}
                  </h3>
                  <p className="text-sm text-muted-foreground">Active Discounts</p>
                </CardContent>
              </Card>
            </div>
            
            {referralStats?.next_badge && (
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Next Badge: {referralStats.next_badge.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {referralStats.referral_count}/{referralStats.next_badge.required_referrals} Referrals
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {referralStats.next_badge.required_referrals - referralStats.referral_count} more referral(s) to unlock!
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="rewards">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold mb-2">Your Badges</h3>
            <div className="flex flex-wrap gap-4">
              {referralStats?.badges && referralStats.badges.length > 0 ? (
                referralStats.badges.map((badge) => (
                  <div key={badge.id} className="text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mt-2 text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Refer friends to earn badges!
                </p>
              )}
            </div>
            
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Your Discount Codes</h3>
              {discountCodes && discountCodes.length > 0 ? (
                <div className="space-y-2">
                  {discountCodes.map((code, i) => (
                    <div 
                      key={i} 
                      className={`p-3 border rounded-lg flex justify-between items-center ${
                        code.used ? 'bg-muted' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-mono">{code.code}</span>
                          {code.used && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Used
                            </Badge>
                          )}
                          {!code.used && new Date(code.expires_at) < new Date() && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Expired
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-semibold text-primary">{code.amount}% off</span>
                          {' • '}
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires {formatDate(code.expires_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={code.used}
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          toast.success('Discount code copied to clipboard!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No discount codes available.
                </p>
              )}
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="referrals">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Your Referred Friends</h3>
            {referralStats?.referrals && referralStats.referrals.length > 0 ? (
              <div className="space-y-4">
                {referralStats.referrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-4">
                        <AvatarFallback>
                          {referral.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{referral.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {formatDate(referral.join_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                        {referral.reward.points} points
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  You haven't referred any friends yet.
                </p>
                <Button 
                  variant="default" 
                  className="mt-4"
                  onClick={shareReferralLink}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Your Link
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          For each friend who signs up using your code, both of you receive a 10% discount code and you earn 100 XP points.
        </p>
      </CardFooter>
    </Card>
  );
};

export default ReferralDashboard;
