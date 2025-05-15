import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Theme colors that match the web app's wood-themed styling
export const colors = {
  // Primary colors from web app
  primary: '#4292c6', // Match web app primary (blue)
  primaryLight: '#64a6da',
  primaryDark: '#2c7cb4',
  
  // Wood theme palette (enhanced from web app)
  wood: {
    lightest: '#f5f0e6', // Very light wood
    light: '#deb887', // BurlyWood
    medium: '#b8860b', // DarkGoldenRod
    dark: '#8b4513',   // SaddleBrown
    darkest: '#5D4037', // Dark Brown
    accent: '#a0522d', // Sienna
    grain: 'rgba(139, 69, 19, 0.08)', // For wood grain texture
  },
  
  // Secondary and accent colors
  secondary: '#f97316', // Orange - matches web app's accent
  secondaryLight: '#fb923c',
  secondaryDark: '#ea580c',
  accent: '#f59e0b', // Amber - from web app
  
  // Background and surface colors
  background: '#f9f6f2', // Light cream background
  surface: '#ffffff',
  surfaceVariant: '#f5f0e6', // Lighter cream
  
  // Text and content colors
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onBackground: '#3c2415', // Dark wood color
  onSurface: '#4b2e1a', // Slightly lighter wood color
  
  // Status colors
  error: '#ef4444',
  onError: '#ffffff',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#0ea5e9',
  
  // Neutral colors
  border: '#e8d9c5', // Light wood color
  muted: '#9e8b7c', // Muted wood color
  
  // Campus specific colors (matched from web app)
  campus: {
    blue: '#4292c6', // Primary blue from web
    lightBlue: '#64a6da',
    gray: '#4B5563',
    lightGray: '#9CA3AF',
    accent: '#F59E0B',
    green: '#22c55e',   // Success/green
    red: '#ef4444',     // Error/red
    yellow: '#f59e0b',  // Accent/yellow
    purple: '#8b5cf6',  // Purple for exclusive badges
  },
  
  // UI element specific colors
  card: {
    background: '#ffffff',
    border: '#e8d9c5',
    woodBackground: '#deb887',
    woodBorder: '#b8860b'
  },
  
  // Gradient presets to match web app
  gradients: {
    woodVertical: ['#deb887', '#c19a6b', '#8b4513'],
    woodHorizontal: ['#b8860b', '#a67c3d', '#8b4513'],
    primaryBlue: ['#64a6da', '#4292c6', '#2c7cb4'],
    welcome: ['#4292c6', '#3a7db0', '#2c7cb4'] // Gradient used in homepage welcome section
  }
};

// Font config that matches the web app styling
export const fontConfig = {
  displayLarge: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  titleSmall: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
  },
  labelLarge: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
  },
  labelMedium: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
  },
  labelSmall: {
    fontFamily: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : 'sans-serif',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0,
  },
};

// Border radius to match web app
export const radius = {
  sm: 2,  
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  pill: 9999
};

// Helper function to generate shadow styles
export const createShadow = (elevation = 2) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: elevation },
  shadowOpacity: 0.1 + (elevation * 0.03),
  shadowRadius: elevation * 0.8,
  elevation: elevation,
});

// Spacing scale to match web app
export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Create theme that matches web app's wood aesthetic
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.campus.blue,
    primaryContainer: colors.wood.medium,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    onError: colors.onError,
    surfaceVariant: colors.surfaceVariant,
  },
  fonts: fontConfig,
  roundness: 8,
};

export default theme; 