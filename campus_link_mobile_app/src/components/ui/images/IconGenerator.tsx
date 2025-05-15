import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

/**
 * This component is for generating placeholder images for the app icon and splash screen.
 * In a production app, you would replace these with actual designs.
 */
export const IconGenerator = ({ size = 1024, type = 'icon' }) => {
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: '#fff',
      fontSize: size * 0.3,
      fontWeight: 'bold',
    },
    subtitle: {
      color: '#fff',
      fontSize: size * 0.1,
      marginTop: size * 0.05,
    }
  });

  if (type === 'splash') {
    return (
      <LinearGradient
        colors={[colors.wood.light, colors.wood.dark]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.text}>CL</Text>
        <Text style={styles.subtitle}>Campus Link</Text>
      </LinearGradient>
    );
  }

  // Default icon
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.text}>CL</Text>
    </LinearGradient>
  );
};

export default IconGenerator; 