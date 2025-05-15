import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
import { Loader2, Gift } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Validation schema
const signupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  referral_code: z.string().optional(),
});

type SignupValues = z.infer<typeof signupSchema>;

const SignupPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralInfo, setReferralInfo] = useState<{
    referrer_name: string;
    discount: number;
  } | null>(null);

  // Extract referral code from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refCode = searchParams.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, [location]);

  // Validate the referral code
  const validateReferralCode = async (code: string) => {
    try {
      // Check if referral code exists
      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('referral_code', code)
        .single();
        
      if (referrerError || !referrerData) {
        console.log('Invalid referral code');
        return;
      }
      
      // Set referral info for display
      setReferralInfo({
        referrer_name: `${referrerData.first_name} ${referrerData.last_name}`,
        discount: 10, // 10% discount is our default
      });
    } catch (error) {
      console.error('Error validating referral code:', error);
    }
  };

  // Setup form with default values
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      referral_code: referralCode || '',
    },
  });

  // Update referral code in form when detected from URL
  useEffect(() => {
    if (referralCode) {
      form.setValue('referral_code', referralCode);
    }
  }, [referralCode, form]);

  const onSubmit = async (values: SignupValues) => {
    setIsLoading(true);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
          },
        },
      });

      if (authError) throw authError;

      // Get the user ID from the sign-up response
      const userId = authData.user?.id;

      if (!userId) {
        throw new Error('Failed to create user account');
      }

      // 2. Check if a profile record already exists (it might be created by a trigger)
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 3. Create or update the profile record
      let profileOperation;
      
      if (existingProfile) {
        // Update the existing profile
        profileOperation = supabase
          .from('profiles')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            referred_by: referralCode ? await getReferrerId(referralCode) : null,
          })
          .eq('id', userId);
      } else {
        // Create a new profile
        profileOperation = supabase.from('profiles').insert({
          id: userId,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          referred_by: referralCode ? await getReferrerId(referralCode) : null,
        });
      }

      const { error: profileError } = await profileOperation;

      if (profileError) throw profileError;

      // 4. If there was a referral, process it
      if (referralCode) {
        const referrerId = await getReferrerId(referralCode);
        
        if (referrerId) {
          // Process the referral reward
          await supabase.rpc('process_referral', {
            referrer_id: referrerId,
            referee_id: userId
          });
          
          toast.success('Welcome bonus: 10% discount code added to your account!');
        }
      }

      // 5. Log the user in
      await login(values.email, values.password);

      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get referrer ID from referral code
  const getReferrerId = async (code: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (error || !data) return null;
      return data.id;
    } catch (error) {
      console.error('Error getting referrer ID:', error);
      return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Join CampusLink to connect with your campus community
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {/* Referral banner */}
              {referralInfo && (
                <Alert className="bg-primary/10 border-primary/30">
                  <Gift className="h-4 w-4 text-primary" />
                  <AlertTitle>You've been referred!</AlertTitle>
                  <AlertDescription>
                    {referralInfo.referrer_name} invited you to CampusLink. 
                    Sign up now to receive a {referralInfo.discount}% discount!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      At least 8 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referral_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter referral code"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      {referralInfo 
                        ? `${referralInfo.referrer_name}'s referral code applied` 
                        : "Have a friend's referral code? Enter it here"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SignupPage; 