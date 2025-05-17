
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ReferralBadge type definition
export interface ReferralBadge {
  id: string;
  name: string;
  description: string;
  required_referrals: number;
  image_url: string | null;
  earned_at?: string;
}

export interface ReferralStats {
  referral_count: number;
  reward_count: number;
  total_rewards: number;
}

// Define our discount code type
export interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  expires_at: string;
  used: boolean;
}

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [badges, setBadges] = useState<ReferralBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  
  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);
  
  const loadReferralData = async () => {
    setLoading(true);
    try {
      // Fetch the user's referral code
      const { data: profileData } = await supabase
        .from('profiles')
        .select('referral_code, referred_users_count')
        .eq('id', user?.id)
        .single();
        
      if (profileData) {
        setReferralCode(profileData.referral_code || '');
        setReferralCount(profileData.referred_users_count || 0);
      }
      
      // Fetch referral stats using RPC function
      const { data: statsData } = await supabase
        .rpc('get_referral_stats', { user_id: user?.id });
        
      if (statsData) {
        setStats(statsData as ReferralStats);
      }
      
      // Fetch discount codes 
      // Note: using RPC instead of direct table access for better type safety
      const { data: discounts } = await supabase
        .rpc('get_user_discount_codes', { user_id: user?.id });
        
      if (discounts) {
        setDiscountCodes(discounts as DiscountCode[]);
      }
      
      // Fetch badges
      const { data: badgeData } = await supabase
        .from('referral_badges')
        .select('*')
        .order('required_referrals', { ascending: true });
        
      if (badgeData) {
        // Convert id to string to match ReferralBadge type
        const typedBadges: ReferralBadge[] = badgeData.map(badge => ({
          ...badge,
          id: String(badge.id),
        }));
        setBadges(typedBadges);
      }
      
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral information');
    } finally {
      setLoading(false);
    }
  };
  
  const applyReferralCode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('apply_referral_code', { 
          code: code.toUpperCase(),
          user_id: user.id
        });
        
      if (error) throw error;
      
      if (data === true) {
        toast.success('Referral code applied successfully!');
        return true;
      } else {
        toast.error('Invalid or already used referral code');
        return false;
      }
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      toast.error(error.message || 'Failed to apply referral code');
      return false;
    }
  };
  
  return {
    referralCode,
    referralCount,
    discountCodes,
    badges,
    loading,
    stats,
    applyReferralCode,
    refreshData: loadReferralData
  };
};
