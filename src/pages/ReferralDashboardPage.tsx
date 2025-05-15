import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';
import ReferralLeaderboard from '@/components/referrals/ReferralLeaderboard';

const ReferralDashboardPage = () => {
  const { user } = useAuth();
  
  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Referral Program</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReferralDashboard />
        </div>
        
        <div className="lg:col-span-1">
          <ReferralLeaderboard 
            limit={5}
            title="Top Referrers"
            description="This month's campus ambassadors"
          />
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border p-6">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Share Your Code</h3>
            <p className="text-muted-foreground">
              Share your unique referral code with friends who aren't on CampusLink yet.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">2</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Friends Sign Up</h3>
            <p className="text-muted-foreground">
              When they create an account using your code, both of you get rewards.
            </p>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">3</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Earn Rewards</h3>
            <p className="text-muted-foreground">
              Get discount codes, XP points, and unlock special badges as you refer more people.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Referral Badges</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-3">
              <span className="text-orange-800 font-bold">🥉</span>
            </div>
            <h3 className="font-medium">Bronze Ambassador</h3>
            <p className="text-sm text-muted-foreground mt-1">1 referral</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <span className="text-slate-800 font-bold">🥈</span>
            </div>
            <h3 className="font-medium">Silver Ambassador</h3>
            <p className="text-sm text-muted-foreground mt-1">5 referrals</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
              <span className="text-amber-800 font-bold">🥇</span>
            </div>
            <h3 className="font-medium">Gold Ambassador</h3>
            <p className="text-sm text-muted-foreground mt-1">10 referrals</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-800 font-bold">💎</span>
            </div>
            <h3 className="font-medium">Platinum Ambassador</h3>
            <p className="text-sm text-muted-foreground mt-1">25 referrals</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 bg-muted/30 p-6 rounded-lg border text-center">
        <h2 className="text-xl font-medium mb-2">Ready to Grow Your Network?</h2>
        <p className="text-muted-foreground mb-4">
          Share your referral code with friends and help build a stronger campus community.
        </p>
      </div>
    </div>
  );
};

export default ReferralDashboardPage; 