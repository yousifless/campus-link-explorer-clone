import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from './theme';

type BadgeVariant = 
  | 'default' 
  | 'primary'
  | 'secondary' 
  | 'outline' 
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'wood';

type BadgeSize = 'default' | 'sm' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  onPress?: () => void;
  woodStyle?: boolean;
}

export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'default',
  style,
  textStyle,
  icon,
  onPress,
  woodStyle = false,
}: BadgeProps) => {
  const getVariantStyles = () => {
    // Override variant if woodStyle is true
    if (woodStyle) variant = 'wood';

    switch (variant) {
      case 'default':
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.onPrimary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
          textColor: colors.onSecondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          textColor: colors.onBackground,
        };
      case 'destructive':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          textColor: colors.onError,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          textColor: colors.onPrimary,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          borderColor: colors.warning,
          textColor: colors.onPrimary,
        };
      case 'info':
        return {
          backgroundColor: colors.info,
          borderColor: colors.info,
          textColor: colors.onPrimary,
        };
      case 'wood':
        return {
          backgroundColor: colors.wood.medium,
          borderColor: colors.wood.dark,
          textColor: colors.onPrimary,
          useGradient: true,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.onPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: spacing[1.5],
          paddingVertical: spacing[0.5],
          fontSize: 10,
          borderRadius: radius.sm,
        };
      case 'lg':
        return {
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1.5],
          fontSize: 14,
          borderRadius: radius.lg,
        };
      default:
        return {
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
          fontSize: 12,
          borderRadius: radius.md,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  // Wood style badge using LinearGradient
  if (variant === 'wood' || woodStyle) {
    const content = (
      <LinearGradient
        colors={[colors.wood.dark, colors.wood.medium, colors.wood.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
            borderRadius: sizeStyles.borderRadius,
          },
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {typeof children === 'string' ? (
          <Text
            style={[
              styles.text,
              { 
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <Pressable 
          onPress={onPress}
          style={({ pressed }) => [
            { opacity: pressed ? 0.8 : 1 },
            styles.pressable
          ]}
        >
          {content}
        </Pressable>
      );
    }

    return content;
  }

  // Standard badge
  const content = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            { 
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
          styles.pressable
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
  },
  iconContainer: {
    marginRight: spacing[1],
  },
  pressable: {
    alignSelf: 'flex-start',
  }
});

export default Badge; 