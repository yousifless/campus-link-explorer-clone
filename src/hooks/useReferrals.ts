
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DiscountCode, ReferralBadge, ReferralStats } from '@/types/referrals';

export const useReferrals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [badges, setBadges] = useState<ReferralBadge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<ReferralStats>({
    referral_count: 0,
    total_points: 0,
    badges: [],
    next_badge: null,
    referrals: []
  });

  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Get referral code
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      }
      
      // Get referral count
      const { data: referralsData, error: referralsError } = await supabase
        .from('referral_rewards')
        .select('id')
        .eq('referrer_id', user.id);
      
      if (referralsError) throw referralsError;
      
      setReferralCount(referralsData?.length || 0);
      
      // Get discount codes
      const { data: codesData, error: codesError } = await supabase
        .from('referral_rewards')
        .select(`
          discount_code,
          discount_amount,
          discount_used,
          expires_at
        `)
        .eq('referrer_id', user.id);
      
      if (codesError) throw codesError;
      
      if (codesData) {
        const codes = codesData.map(item => ({
          code: item.discount_code,
          amount: item.discount_amount,
          expires_at: item.expires_at,
          used: item.discount_used,
        }));
        
        setDiscountCodes(codes);
      }
      
      // Get earned badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          badge: badge_id (
            id,
            name,
            description,
            required_referrals,
            image_url
          ),
          earned_at
        `)
        .eq('user_id', user.id);
      
      if (badgesError) throw badgesError;
      
      if (badgesData) {
        const formattedBadges = badgesData.map(item => ({
          ...item.badge,
          earned_at: item.earned_at
        }));
        
        setBadges(formattedBadges);
      }
      
      // Get all referral stats using RPC instead of a direct call
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_referral_stats', { user_id: user.id });
      
      if (statsError) {
        console.error('Error fetching referral stats:', statsError);
      } else if (statsData) {
        setStats(statsData as ReferralStats);
      }
    } catch (error) {
      console.error('Error refreshing referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const applyReferralCode = async (code: string) => {
    if (!user || !code) return { success: false };
    
    try {
      const { data, error } = await supabase
        .rpc('apply_referral_code', { 
          p_referee_id: user.id, 
          p_referral_code: code 
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Referral code applied successfully!"
      });
      
      await refreshData();
      return { success: true };
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to apply referral code",
        variant: "destructive"
      });
      return { success: false };
    }
  };
  
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);
  
  return {
    referralCode,
    referralCount,
    discountCodes,
    badges,
    loading,
    stats,
    applyReferralCode,
    refreshData
  };
};
