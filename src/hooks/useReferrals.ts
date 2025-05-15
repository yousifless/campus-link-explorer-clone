
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReferralStats {
  referral_count: number;
  total_points: number;
  badges: any[];
  next_badge: any;
  referrals: any[];
}

export interface DiscountCode {
  code: string;
  amount: number;
  expires_at: string;
  used: boolean;
}

const useReferrals = () => {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the raw SQL query approach with RPC or custom SQL endpoint
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_referral_stats');

        if (statsError) {
          console.error('Error fetching referral stats:', statsError);
          setError(statsError.message);
          return;
        }

        if (statsData) {
          // Cast the data to the correct type
          setReferralStats(statsData as unknown as ReferralStats);
        }

        // Fetch referral code
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('referral_code')
          .single();

        if (!userError && userData) {
          setReferralCode(userData.referral_code);
          setReferralLink(`https://campuslink.app/join?ref=${userData.referral_code}`);
        }

        // Fetch discount codes
        const { data: discountData, error: discountError } = await supabase
          .from('discount_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!discountError && discountData) {
          setDiscountCodes(discountData.map(code => ({
            code: code.code,
            amount: code.discount_amount,
            expires_at: code.expires_at,
            used: code.used
          })));
        }

      } catch (err) {
        console.error('Error fetching referral data:', err);
        setError('Failed to fetch referral data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, []);

  // Function to copy referral code to clipboard
  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied to clipboard!');
    }
  };

  // Function to share referral link
  const shareReferralLink = () => {
    if (referralLink) {
      if (navigator.share) {
        navigator.share({
          title: 'Join me on CampusLink!',
          text: 'Hey! Join me on CampusLink and we both get rewards.',
          url: referralLink,
        }).catch((err) => {
          console.error('Error sharing:', err);
          copyReferralLink();
        });
      } else {
        copyReferralLink();
      }
    }
  };

  // Helper function to copy referral link
  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  return {
    referralStats,
    referralCode,
    referralLink,
    discountCodes,
    loading,
    error,
    copyReferralCode,
    shareReferralLink
  };
};

export default useReferrals;
