import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  referral_count: number;
  total_points: number;
  badges: any[];
  next_badge: any;
  referrals: any[];
}

const useReferrals = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('referral_stats_view')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching referral stats:', error);
          setError(error.message);
          return;
        }

        // Fix the type conversion issue by properly casting the data
        const typedStats = data as unknown as ReferralStats;
        setStats(typedStats);

      } catch (err) {
        console.error('Error fetching referral stats:', err);
        setError('Failed to fetch referral stats');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralStats();
  }, []);

  return { stats, loading, error };
};

export default useReferrals;
