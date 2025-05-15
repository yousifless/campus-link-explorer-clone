import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input, Card, colors, createShadow, spacing } from '../components/ui';
import AppIcon from '../components/ui/icons/AppIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthActions from '../hooks/useAuthActions';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, setError } = useAuthActions();

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Login successful, navigation will happen automatically via AppNavigator
      console.log('Login successful');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Render wood grain background pattern
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
              <AppIcon size={120} variant="full" />
              <Text style={styles.appName}>Campus Link</Text>
              <Text style={styles.appTagline}>Connect with your campus community</Text>
            </View>

            <Card style={styles.card} variant="wood">
              <Card.Header 
                title="Welcome Back" 
                subtitle="Please sign in to your account" 
                center
                woodStyle
              />
              <Card.Content style={styles.cardContent}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<MaterialCommunityIcons name="email" size={24} color={colors.campus.blue} />}
                  placeholder="your@email.com"
                  containerStyle={styles.inputContainer}
                  variant="outlined"
                  required
                />

                <Input
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
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
                  containerStyle={styles.inputContainer}
                  variant="outlined"
                  required
                />

                {error ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Button
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  variant="campus"
                  size="lg"
                  style={styles.loginButton}
                  leftIcon={<MaterialCommunityIcons name="login" size={20} color={colors.onPrimary} />}
                >
                  Sign In
                </Button>

                <View style={styles.forgotContainer}>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.footerContainer}>
              <Text style={styles.noAccountText}>Don't have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Signup')}
                style={styles.signUpButton}
              >
                <Text style={styles.signUpText}>Sign up</Text>
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
    top: -width * 0.2,
    right: -width * 0.3,
    transform: [{ rotate: '30deg' }],
  },
  circle2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.2,
    left: -width * 0.3,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.onPrimary,
    marginTop: spacing[4],
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 16,
    color: colors.wood.lightest,
    marginTop: spacing[2],
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
    marginBottom: spacing[5],
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
  loginButton: {
    marginTop: spacing[2],
    height: 50,
  },
  forgotContainer: {
    alignItems: 'center',
    marginTop: spacing[5],
  },
  forgotText: {
    color: colors.campus.blue,
    fontWeight: '600',
    fontSize: 15,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  noAccountText: {
    color: colors.wood.lightest,
    fontWeight: '500',
    fontSize: 15,
  },
  signUpButton: {
    marginLeft: spacing[2],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  signUpText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default LoginScreen; 