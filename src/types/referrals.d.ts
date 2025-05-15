
export interface ReferralBadge {
  id: string | number; // Make it accept both string and number
  name: string;
  description: string;
  required_referrals: number;
  image_url: string | null;
  earned_at?: string;
}

export interface DiscountCode {
  code: string;
  amount: number;
  expires_at: string;
  used: boolean;
}

export interface ReferralStats {
  referral_count: number;
  total_points: number;
  badges: ReferralBadge[];
  next_badge: ReferralBadge | null;
  referrals: any[];
}
