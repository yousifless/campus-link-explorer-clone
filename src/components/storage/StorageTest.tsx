import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { testStorageAccess, uploadAvatar, ensureAvatarBucket, AVATAR_BUCKET_NAME } from '@/utils/storage';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const StorageTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: any } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [bucketInfo, setBucketInfo] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; url?: string; error?: any } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    user: any;
    session: any;
    error: any;
  }>({
    user: null,
    session: null,
    error: null
  });
  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<{
    exists: boolean;
    loading: boolean;
    error: any;
  }>({
    exists: false,
    loading: true,
    error: null
  });

  // Check authentication status on component mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log("Current auth user:", userData.user);
        console.log("Auth error:", userError);
        
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("Current session:", sessionData.session);
        console.log("Session error:", sessionError);
        
        setAuthStatus({
          user: userData.user,
          session: sessionData.session,
          error: userError || sessionError
        });
      } catch (error) {
        console.error("Error checking auth:", error);
        setAuthStatus(prev => ({ ...prev, error }));
      }
    }
    
    checkAuth();
  }, []);

  // Check bucket status on component mount
  useEffect(() => {
    async function checkBucket() {
      setBucketStatus(prev => ({ ...prev, loading: true }));
      try {
        // List all buckets
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Error listing buckets:', listError);
          setBucketStatus({
            exists: false,
            loading: false,
            error: listError
          });
          return;
        }
        
        // Check if our bucket exists
        const bucketExists = buckets.some(bucket => bucket.name === AVATAR_BUCKET_NAME);
        console.log(`Bucket '${AVATAR_BUCKET_NAME}' exists:`, bucketExists);
        
        setBucketStatus({
          exists: bucketExists,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error checking bucket:', error);
        setBucketStatus({
          exists: false,
          loading: false,
          error
        });
      }
    }
    
    checkBucket();
  }, []);

  const handleTestStorage = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Ensure the bucket exists
      await ensureAvatarBucket();
      
      // Test storage access
      const testResult = await testStorageAccess();
      setResult(testResult);
      
      // Get session info
      const { data: sessionData } = await supabase.auth.getSession();
      setSessionInfo(sessionData);
      
      // Get bucket info
      const { data: bucketsData, error: bucketsError } = await supabase
        .storage
        .listBuckets();
        
      if (bucketsError) {
        console.error('Error fetching buckets:', bucketsError);
      } else {
        setBucketInfo(bucketsData);
        
        // Update bucket status
        const bucketExists = bucketsData.some(bucket => bucket.name === AVATAR_BUCKET_NAME);
        setBucketStatus({
          exists: bucketExists,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error during storage test:', error);
      setResult({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingFile(true);
    setUploadResult(null);
    
    try {
      // Ensure the bucket exists before uploading
      await ensureAvatarBucket();
      
      const file = e.target.files[0];
      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
      
      const url = await uploadAvatar(file);
      setUploadResult({ success: true, url });
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadResult({ success: false, error });
    } finally {
      setUploadingFile(false);
    }
  };

  const fetchStoragePolicies = async () => {
    setLoadingPolicies(true);
    try {
      // Instead of querying pg_policies directly, we'll use a more client-friendly approach
      // by checking the bucket permissions
      const { data: bucketsData, error: bucketsError } = await supabase
        .storage
        .listBuckets();
        
      if (bucketsError) {
        console.error('Error fetching buckets:', bucketsError);
        setPolicies([{ error: bucketsError.message }]);
      } else {
        // For each bucket, try to get its policies
        const policiesData = await Promise.all(
          bucketsData.map(async (bucket) => {
            try {
              // Try to upload a small test file to check permissions
              const testBlob = new Blob(['test'], { type: 'text/plain' });
              const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
              
              const { error } = await supabase.storage
                .from(bucket.name)
                .upload(`test-${Date.now()}.txt`, testFile, {
                  upsert: true
                });
                
              return {
                bucket: bucket.name,
                rls_enabled: bucket.public === false,
                can_upload: !error,
                error: error ? error.message : null
              };
            } catch (err) {
              return {
                bucket: bucket.name,
                rls_enabled: bucket.public === false,
                can_upload: false,
                error: err instanceof Error ? err.message : 'Unknown error'
              };
            }
          })
        );
        
        setPolicies(policiesData);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies([{ error: 'Failed to fetch policies' }]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const createBucket = async () => {
    setLoading(true);
    try {
      await ensureAvatarBucket();
      
      // Refresh bucket status
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        setBucketStatus({
          exists: false,
          loading: false,
          error
        });
      } else {
        const bucketExists = buckets.some(bucket => bucket.name === AVATAR_BUCKET_NAME);
        setBucketStatus({
          exists: bucketExists,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
      setBucketStatus(prev => ({
        ...prev,
        loading: false,
        error
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Storage Access Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test">
          <TabsList className="mb-4">
            <TabsTrigger value="test">Test Storage</TabsTrigger>
            <TabsTrigger value="auth">Auth Status</TabsTrigger>
            <TabsTrigger value="policies">RLS Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test">
            <div className="space-y-4">
              <Alert variant={bucketStatus.exists ? 'default' : 'destructive'}>
                <AlertTitle>
                  {bucketStatus.loading 
                    ? 'Checking Bucket Status...' 
                    : bucketStatus.exists 
                      ? 'Bucket Ready' 
                      : 'Bucket Not Found'}
                </AlertTitle>
                <AlertDescription>
                  {bucketStatus.loading 
                    ? 'Checking if the avatar bucket exists...' 
                    : bucketStatus.exists 
                      ? `The '${AVATAR_BUCKET_NAME}' bucket exists and is ready to use.` 
                      : `The '${AVATAR_BUCKET_NAME}' bucket does not exist. Click the button below to create it.`}
                </AlertDescription>
              </Alert>
              
              {!bucketStatus.exists && !bucketStatus.loading && (
                <Button 
                  onClick={createBucket} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Creating Bucket...' : 'Create Avatar Bucket'}
                </Button>
              )}
              
              <Button 
                onClick={handleTestStorage} 
                disabled={loading || !bucketStatus.exists}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Storage Access'}
              </Button>
              
              {result && (
                <Alert variant={result.success ? 'default' : 'destructive'}>
                  <AlertTitle>
                    {result.success ? 'Test Successful' : 'Test Failed'}
                  </AlertTitle>
                  <AlertDescription>
                    {result.success 
                      ? 'Storage access is working correctly.' 
                      : `Error: ${result.error?.message || JSON.stringify(result.error)}`}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Test File Upload</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile || !bucketStatus.exists}
                    accept="image/*"
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={uploadingFile || !bucketStatus.exists}
                      asChild
                    >
                      <span>{uploadingFile ? 'Uploading...' : 'Upload Test File'}</span>
                    </Button>
                  </label>
                </div>
                
                {uploadResult && (
                  <Alert 
                    variant={uploadResult.success ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    <AlertTitle>
                      {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                    </AlertTitle>
                    <AlertDescription>
                      {uploadResult.success 
                        ? `File uploaded successfully. URL: ${uploadResult.url}` 
                        : `Error: ${uploadResult.error?.message || JSON.stringify(uploadResult.error)}`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {sessionInfo && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Session Information</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              {bucketInfo && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Available Buckets</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(bucketInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="auth">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Authentication Status</h3>
              
              <Alert variant={authStatus.user ? 'default' : 'destructive'}>
                <AlertTitle>
                  {authStatus.user ? 'Authenticated' : 'Not Authenticated'}
                </AlertTitle>
                <AlertDescription>
                  {authStatus.error 
                    ? `Auth Error: ${authStatus.error.message || JSON.stringify(authStatus.error)}` 
                    : authStatus.user 
                      ? `User ID: ${authStatus.user.id}` 
                      : 'No authenticated user found'}
                </AlertDescription>
              </Alert>
              
              {authStatus.user && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">User Details</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(authStatus.user, null, 2)}
                  </pre>
                </div>
              )}
              
              {authStatus.session && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Session Details</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(authStatus.session, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="policies">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Storage RLS Policies</h3>
                <Button 
                  onClick={fetchStoragePolicies} 
                  disabled={loadingPolicies}
                  variant="outline"
                >
                  {loadingPolicies ? 'Loading...' : 'Refresh Policies'}
                </Button>
              </div>
              
              {policies.length > 0 ? (
                <div className="mt-4">
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(policies, null, 2)}
                  </pre>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No policies found or unable to fetch policies. This might require admin access.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4">
                <h3 className="text-lg font-medium">RLS Policy Troubleshooting</h3>
                <p className="text-sm text-gray-500 mt-2">
                  If you're experiencing RLS issues, check the following:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li>Ensure the bucket has RLS enabled in the Supabase dashboard</li>
                  <li>Verify the policy allows the current user to upload to the specified path</li>
                  <li>Check that the path structure matches what the policy expects</li>
                  <li>Confirm the user has the necessary permissions</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 