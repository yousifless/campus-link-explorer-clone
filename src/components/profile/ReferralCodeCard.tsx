import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Gift, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ReferralCodeCardProps {
  minimal?: boolean;
  className?: string;
}

const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({ 
  minimal = false,
  className 
}) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchReferralData = async () => {
      try {
        setLoading(true);
        
        // Get user's referral code
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;
        
        if (userData?.referral_code) {
          setReferralCode(userData.referral_code);
          setReferralLink(`${window.location.origin}/signup?ref=${userData.referral_code}`);
          
          // Get count of referrals
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('referred_by', user.id);
            
          if (!countError && count !== null) {
            setReferralCount(count);
          }
        }
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralData();
  }, [user]);
  
  const copyReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied to clipboard!');
    } catch (error) {
      console.error('Error copying code:', error);
      toast.error('Failed to copy referral code');
    }
  };
  
  const shareReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on CampusLink!',
          text: 'I\'m using CampusLink to connect with other students on campus. Use my referral link to sign up and get a discount!',
          url: referralLink
        });
      } else {
        await navigator.clipboard.writeText(referralLink);
        toast.success('Referral link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share referral link');
    }
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Gift className="h-5 w-5 mr-2 text-primary" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!referralCode) {
    return null; // Don't show the card if there's no referral code
  }
  
  if (minimal) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium flex items-center">
                <Gift className="h-4 w-4 mr-1 text-primary" />
                Your Referral Code:
              </p>
              <p className="font-mono font-medium text-xs">{referralCode}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={copyReferralCode} className="h-8 w-8">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" onClick={shareReferralLink} className="h-8 w-8">
                <Share2 className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" asChild className="h-8 w-8">
                <Link to="/referrals">
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2 text-primary" />
          Your Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends and earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">{referralCount}</p>
            <p className="text-sm text-muted-foreground">Friends Referred</p>
          </div>
          
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {referralCount * 100}
            </p>
            <p className="text-sm text-muted-foreground">Points Earned</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={shareReferralLink}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Link
        </Button>
        <Button asChild>
          <Link to="/referrals">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Dashboard
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReferralCodeCard; 