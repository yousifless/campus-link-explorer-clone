import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralStats, ReferralReward, DiscountCode } from '@/types/referrals';

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch referral data
  useEffect(() => {
    if (!user) return;
    
    const fetchReferralData = async () => {
      setLoading(true);
      try {
        // Get user's referral code
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;
        
        setReferralCode(userData.referral_code);
        setReferralLink(`${window.location.origin}/signup?ref=${userData.referral_code}`);
        
        // Get referral stats
        const { data: statsData, error: statsError } = await supabase.rpc(
          'get_referral_stats',
          { user_id: user.id }
        );
        
        if (statsError) throw statsError;
        
        setReferralStats(statsData as ReferralStats);
        
        // Get active discount codes
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('referral_rewards')
          .select('discount_code, discount_amount, discount_used, expires_at')
          .or(`referrer_id.eq.${user.id},referee_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
          
        if (rewardsError) throw rewardsError;
        
        const codes: DiscountCode[] = rewardsData.map(reward => ({
          code: reward.discount_code,
          amount: reward.discount_amount,
          expires_at: reward.expires_at,
          used: reward.discount_used
        }));
        
        setDiscountCodes(codes);
      } catch (error) {
        console.error('Error fetching referral data:', error);
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferralData();
  }, [user]);
  
  // Share referral link
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
  
  // Copy referral code to clipboard
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
  
  // Validate a discount code
  const validateDiscountCode = async (code: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('discount_amount, discount_used, expires_at')
        .eq('discount_code', code)
        .single();
        
      if (error) throw error;
      
      // Check if code is valid (not used and not expired)
      if (data.discount_used) {
        toast.error('This discount code has already been used');
        return null;
      }
      
      if (new Date(data.expires_at) < new Date()) {
        toast.error('This discount code has expired');
        return null;
      }
      
      return data.discount_amount;
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast.error('Invalid discount code');
      return null;
    }
  };
  
  // Apply a discount code
  const applyDiscountCode = async (code: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('referral_rewards')
        .update({ discount_used: true })
        .eq('discount_code', code);
        
      if (error) throw error;
      
      // Update local state
      setDiscountCodes(prev => 
        prev.map(c => 
          c.code === code ? { ...c, used: true } : c
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error applying discount code:', error);
      toast.error('Failed to apply discount code');
      return false;
    }
  };
  
  return {
    referralStats,
    referralCode,
    referralLink,
    discountCodes,
    loading,
    shareReferralLink,
    copyReferralCode,
    validateDiscountCode,
    applyDiscountCode
  };
}; 