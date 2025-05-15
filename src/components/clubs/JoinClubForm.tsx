import React, { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Club, ClubVisibility } from '@/types/clubs';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface JoinClubFormProps {
  onSuccess?: (club: Club) => void;
}

const JoinClubForm = ({ onSuccess }: JoinClubFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to join a club');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Find the club by join code
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('join_code', joinCode.trim())
        .single();

      if (clubError || !clubData) {
        setError('Invalid join code. Please check and try again.');
        return;
      }

      // 2. Check if user is already a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('club_id', clubData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipData) {
        toast.info('You are already a member of this club');
        navigate(`/clubs/${clubData.id}`);
        return;
      }

      // 3. Add user as a member
      const { error: joinError } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubData.id,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (joinError) {
        throw joinError;
      }

      toast.success(`Successfully joined ${clubData.name}!`);
      
      // Call the success callback or navigate to the club
      if (onSuccess) {
        // Convert the clubData to match the Club type
        const club: Club = {
          ...clubData,
          visibility: clubData.visibility as ClubVisibility
        };
        onSuccess(club);
      } else {
        navigate(`/clubs/${clubData.id}`);
      }
    } catch (error) {
      console.error('Error joining club:', error);
      setError('Failed to join club. Please try again.');
      toast.error('Failed to join club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Join a Club</CardTitle>
        <CardDescription>
          Enter a club's join code to become a member
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleJoinClub}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="join-code">Join Code</Label>
              <Input
                id="join-code"
                placeholder="Enter club join code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                disabled={isLoading}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/clubs')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Club'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinClubForm; 