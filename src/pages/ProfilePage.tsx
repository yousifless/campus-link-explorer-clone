import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { supabase } from '@/integrations/supabase/client';
import { makeBucketPublic } from '@/utils/storage';
import { Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketPublic, setBucketPublic] = useState<boolean | null>(null);
  const [makingPublic, setMakingPublic] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error getting user:", userError);
          setError(`Error getting user: ${userError.message}`);
          return;
        }
        
        if (!user) {
          console.error("No user found");
          setError("No authenticated user found");
          return;
        }
        
        setUserId(user.id);
        
        // Check if the avatar bucket is public
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error("Error listing buckets:", bucketsError);
        } else {
          const avatarBucket = buckets.find(bucket => bucket.name === 'avatars');
          setBucketPublic(avatarBucket?.public || false);
        }
      } catch (error) {
        console.error("Error in loadUser:", error);
        setError(`Error loading user: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const handleMakeBucketPublic = async () => {
    try {
      setMakingPublic(true);
      await makeBucketPublic();
      setBucketPublic(true);
    } catch (error) {
      console.error("Error making bucket public:", error);
      setError(`Error making bucket public: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMakingPublic(false);
    }
  };

  const handleAvatarUpdated = (url: string) => {
    console.log("Avatar updated with URL:", url);
    // You can add additional logic here if needed
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={() => navigate('/')} 
              className="mt-4"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to view your profile.</p>
            <Button 
              onClick={() => navigate('/login')} 
              className="mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="avatar" className="w-full max-w-4xl mx-auto">
        <TabsList className="mb-4">
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="avatar">
          <ProfileAvatar 
            userId={userId} 
            onAvatarUpdated={handleAvatarUpdated} 
          />
          
          {bucketPublic === false && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Bucket Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The avatar bucket is currently private. This means that only you can see your avatar.
                  If you want others to be able to see your avatar, you can make the bucket public.
                </p>
                <Button 
                  onClick={handleMakeBucketPublic} 
                  disabled={makingPublic}
                >
                  {makingPublic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Making Bucket Public...
                    </>
                  ) : (
                    'Make Bucket Public'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Profile settings will be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 