import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, colors, createShadow, spacing } from '../components/ui';
import AppIcon from '../components/ui/icons/AppIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();

  const handleSignup = async () => {
    // Input validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp(email, password);
      // Navigate to profile setup or onboarding
      navigation.navigate('ProfileSetup');
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Render background with decorations
  const renderBackground = () => (
    <View style={styles.backgroundContainer}>
      <LinearGradient
        colors={[
          colors.gradients.woodVertical[0], 
          colors.gradients.woodVertical[1], 
          colors.gradients.woodVertical[2]
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Overlay pattern for wood grain texture */}
        <View style={styles.woodGrainOverlay} />
      </LinearGradient>
      
      {/* Decorative elements */}
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderBackground()}
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <AppIcon size={100} variant="elegant" />
              <Text style={styles.appName}>Join Campus Link</Text>
              <Text style={styles.appTagline}>Create your account to get started</Text>
            </View>

            <Card style={styles.card} variant="wood">
              <Card.Header 
                title="Create Account" 
                subtitle="Join our campus community" 
                woodStyle
                center
              />
              <Card.Content style={styles.cardContent}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<MaterialCommunityIcons name="email" size={24} color={colors.campus.blue} />}
                  placeholder="your@email.com"
                  variant="outlined"
                  required
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  leftIcon={<MaterialCommunityIcons name="lock" size={24} color={colors.campus.blue} />}
                  rightIcon={
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.muted}
                    />
                  }
                  rightIconPress={togglePasswordVisibility}
                  placeholder="••••••••"
                  variant="outlined"
                  required
                  containerStyle={styles.inputContainer}
                  helperText="Must be at least 6 characters"
                />

                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  leftIcon={<MaterialCommunityIcons name="lock-check" size={24} color={colors.campus.blue} />}
                  placeholder="••••••••"
                  variant="outlined"
                  required
                  containerStyle={styles.inputContainer}
                />

                {error ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Button
                  onPress={handleSignup}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  variant="campus"
                  size="lg"
                  style={styles.signupButton}
                  leftIcon={<MaterialCommunityIcons name="account-plus" size={20} color={colors.onPrimary} />}
                >
                  Create Account
                </Button>

                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.footerContainer}>
              <Text style={styles.accountText}>Already have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')} 
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.wood.dark,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  woodGrainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    // Linear pattern that mimics wood grain
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px)' 
      : undefined,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    left: -width * 0.3,
    transform: [{ rotate: '-20deg' }],
  },
  circle2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.3,
    right: -width * 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.onPrimary,
    marginTop: spacing[3],
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  appTagline: {
    fontSize: 16,
    color: colors.wood.lightest,
    marginTop: spacing[1],
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    ...createShadow(8),
  },
  cardContent: {
    padding: spacing[6],
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error,
    marginLeft: spacing[2],
    flex: 1,
    fontSize: 14,
  },
  signupButton: {
    marginTop: spacing[4],
    height: 50,
  },
  termsText: {
    marginTop: spacing[4],
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.campus.blue,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  accountText: {
    color: colors.wood.lightest,
    fontWeight: '500',
    fontSize: 15,
  },
  loginButton: {
    marginLeft: spacing[2],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  loginText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default SignupScreen; 