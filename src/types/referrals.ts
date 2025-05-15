export interface ReferralBadge {
  id: string; // Changed from number to string to match the database
  name: string;
  description: string;
  required_referrals: number;
  image_url: string | null;
  earned_at?: string; // Only present if user has earned the badge
}

export interface UserBadge {
  badge_id: number;
  user_id: string;
  earned_at: string;
  badge?: ReferralBadge;
}

export interface ReferralReward {
  id: number;
  referrer_id: string;
  referee_id: string;
  points_awarded: number;
  discount_code: string;
  discount_amount: number;
  discount_used: boolean;
  created_at: string;
  expires_at: string;
  referee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface ReferredUser {
  id: string;
  name: string;
  join_date: string;
  reward: {
    points: number;
    discount_code: string;
    discount_used: boolean;
    created_at: string;
  };
}

export interface ReferralStats {
  referral_count: number;
  total_points: number;
  badges: ReferralBadge[];
  next_badge: ReferralBadge | null;
  referrals: ReferredUser[];
}

export interface DiscountCode {
  code: string;
  amount: number;
  expires_at: string;
  used: boolean;
}
