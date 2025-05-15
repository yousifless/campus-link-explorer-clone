import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, createShadow } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface AppIconProps {
  size?: number;
  color?: string;
  variant?: 'default' | 'simple' | 'full' | 'campus' | 'elegant';
  showBorder?: boolean;
}

export const AppIcon = ({ 
  size = 100, 
  color = colors.campus.blue, 
  variant = 'default',
  showBorder = true,
}: AppIconProps) => {
  // Simple version just shows the gradient circle with initials
  if (variant === 'simple') {
    return (
      <LinearGradient
        colors={[colors.campus.blue, colors.primaryDark]}
        style={[styles.container, { width: size, height: size }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.text, { fontSize: size * 0.5 }]}>CL</Text>
      </LinearGradient>
    );
  }

  // Campus blue variant
  if (variant === 'campus') {
    return (
      <View style={[styles.campusContainer, { width: size, height: size }]}>
        <LinearGradient
          colors={[colors.campus.blue, colors.primaryDark]}
          style={[styles.campusGradient, { width: size, height: size }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.campusInner}>
            <Text style={[styles.text, { fontSize: size * 0.45 }]}>CL</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Elegant version with subtle design
  if (variant === 'elegant') {
    return (
      <View style={[styles.elegantContainer, { width: size, height: size }]}>
        <LinearGradient
          colors={['#f4f4f8', '#e2e2e6']}
          style={[styles.elegantOuter, { width: size, height: size }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={[styles.elegantInner, { width: size * 0.85, height: size * 0.85 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.elegantText, { fontSize: size * 0.4 }]}>CL</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
    );
  }

  // Full version - uses actual wood textures and more realistic look
  if (variant === 'full') {
    return (
      <View style={[styles.fullOuterContainer, { width: size * 1.2, height: size * 1.2 }]}>
        {/* Premium wood frame with enhanced gradients */}
        <LinearGradient
          colors={[
            colors.wood.darkest, 
            colors.wood.dark, 
            colors.wood.medium,
            colors.wood.dark,
            colors.wood.darkest, 
          ]}
          style={[styles.fullWoodFrame, { width: size * 1.2, height: size * 1.2 }]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        >
          {/* Wood grain texture overlay */}
          <View style={styles.woodGrainTexture} />
          
          {/* Inner bevel */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.3)', 
              'rgba(255,255,255,0.1)',
              'rgba(0,0,0,0.1)',
              'rgba(0,0,0,0.3)'
            ]}
            style={[styles.fullBeveledFrame, { width: size * 1.1, height: size * 1.1 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Inset shadow */}
            <View style={styles.insetShadow}>
              {/* Center content */}
              <LinearGradient
                colors={[colors.campus.blue, colors.primaryDark]}
                style={[styles.fullIconContent, { width: size * 0.9, height: size * 0.9 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.fullText, { fontSize: size * 0.4 }]}>CL</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>
    );
  }

  // Default wooden frame version
  return (
    <View style={[styles.outerContainer, { width: size * 1.2, height: size * 1.2 }]}>
      {/* Wood frame outer gradient - darker wood edge */}
      <LinearGradient
        colors={[
          colors.wood.darkest, 
          colors.wood.dark, 
          colors.wood.medium, 
          colors.wood.dark
        ]}
        style={[styles.woodFrame, { width: size * 1.2, height: size * 1.2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Beveled edge inner frame */}
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.2)', 
            'rgba(0,0,0,0.1)'
          ]}
          style={[styles.beveledFrame, { width: size * 1.1, height: size * 1.1 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon content */}
          <LinearGradient
            colors={[colors.campus.blue, colors.primaryDark]}
            style={[styles.iconBackground, { width: size, height: size }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.text, { fontSize: size * 0.5 }]}>CL</Text>
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // Default styles
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow(8),
  },
  woodFrame: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  beveledFrame: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    ...createShadow(4),
  },
  iconBackground: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(4),
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  
  // Campus variant styles
  campusContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow(6),
  },
  campusGradient: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  campusInner: {
    width: '80%',
    height: '80%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Elegant variant styles
  elegantContainer: {
    borderRadius: 100, // Full circle
    overflow: 'hidden',
    ...createShadow(5),
  },
  elegantOuter: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  elegantInner: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elegantText: {
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Full premium variant styles
  fullOuterContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    ...createShadow(12),
  },
  fullWoodFrame: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  woodGrainTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: 'transparent',
    // Linear pattern that mimics wood grain
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px)' 
      : undefined,
  },
  fullBeveledFrame: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  insetShadow: {
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
    // Custom inset shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  fullIconContent: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  fullText: {
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
});

export default AppIcon; 