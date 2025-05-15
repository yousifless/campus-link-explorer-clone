import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator, Pressable } from 'react-native';
import { colors, spacing, radius, createShadow } from './theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 
  | 'default' 
  | 'primary'
  | 'outline' 
  | 'secondary' 
  | 'destructive' 
  | 'ghost' 
  | 'link' 
  | 'wood'
  | 'campus';

type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'xl' | 'icon';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
  textStyle?: any;
  arrowIcon?: boolean;
}

export const Button = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  arrowIcon = false,
}: ButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  // Handle press state to simulate hover
  const handlePressIn = () => setIsPressed(true);
  const handlePressOut = () => setIsPressed(false);

  const getVariantStyle = () => {
    switch (variant) {
      case 'default':
      case 'primary':
        return {
          backgroundColor: isPressed ? colors.primaryDark : colors.primary,
          borderColor: colors.primary,
          color: colors.onPrimary,
        };
      case 'secondary':
        return {
          backgroundColor: isPressed ? colors.secondaryDark : colors.secondary,
          borderColor: colors.secondary,
          color: colors.onSecondary,
        };
      case 'outline':
        return {
          backgroundColor: isPressed ? 'rgba(66, 146, 198, 0.1)' : 'transparent',
          borderColor: colors.primary,
          color: colors.primary,
        };
      case 'destructive':
        return {
          backgroundColor: isPressed ? '#dc2626' : colors.error,
          borderColor: colors.error,
          color: colors.onError,
        };
      case 'ghost':
        return {
          backgroundColor: isPressed ? 'rgba(66, 146, 198, 0.1)' : 'transparent',
          borderColor: 'transparent',
          color: colors.onBackground,
        };
      case 'link':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: isPressed ? colors.primaryDark : colors.primary,
          textDecoration: 'underline',
        };
      case 'wood':
        return {
          backgroundColor: colors.wood.medium,
          borderColor: colors.wood.dark,
          color: colors.onPrimary,
          useGradient: true,
          gradientColors: isPressed ? 
            [colors.wood.darkest, colors.wood.dark, colors.wood.medium] : 
            [colors.wood.dark, colors.wood.medium, colors.wood.light],
        };
      case 'campus':
        return {
          backgroundColor: isPressed ? colors.campus.blue : colors.campus.blue,
          borderColor: colors.campus.blue,
          color: colors.onPrimary,
          shadow: true,
        };
      default:
        return {
          backgroundColor: isPressed ? colors.primaryDark : colors.primary,
          borderColor: colors.primary,
          color: colors.onPrimary,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'xs':
        return {
          paddingVertical: spacing[1],
          paddingHorizontal: spacing[2],
          fontSize: 12,
          iconSize: 12,
          borderRadius: radius.sm,
        };
      case 'sm':
        return {
          paddingVertical: spacing[1.5],
          paddingHorizontal: spacing[3],
          fontSize: 14,
          iconSize: 16,
          borderRadius: radius.md,
        };
      case 'lg':
        return {
          paddingVertical: spacing[2.5],
          paddingHorizontal: spacing[5],
          fontSize: 16,
          iconSize: 20,
          borderRadius: radius.lg,
        };
      case 'xl':
        return {
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[6],
          fontSize: 18,
          iconSize: 24,
          borderRadius: radius.lg,
        };
      case 'icon':
        return {
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[2],
          minWidth: 40,
          minHeight: 40,
          iconSize: 20,
          borderRadius: radius.md,
        };
      default:
        return {
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[4],
          fontSize: 16,
          iconSize: 16,
          borderRadius: radius.md,
        };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variantStyle.backgroundColor,
      borderColor: variantStyle.borderColor,
      borderRadius: sizeStyle.borderRadius,
      opacity: disabled ? 0.5 : 1,
      paddingVertical: sizeStyle.paddingVertical,
      paddingHorizontal: sizeStyle.paddingHorizontal,
    },
    fullWidth && styles.fullWidth,
    variantStyle.shadow && styles.buttonShadow,
    style,
  ];

  const textStyles = [
    styles.text,
    { 
      color: variantStyle.color, 
      fontSize: sizeStyle.fontSize,
      textDecorationLine: variantStyle.textDecoration ? 'underline' : 'none',
    },
    disabled && styles.disabledText,
    textStyle,
  ];

  // For the wood style button, we wrap with a LinearGradient
  if (variant === 'wood') {
    // Create layered wood effect with nested gradients
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          fullWidth && styles.fullWidth,
          styles.woodButtonContainer,
          style,
        ]}
      >
        {/* Wood grain texture overlay */}
        <LinearGradient
          colors={variantStyle.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.woodOuterGradient,
            {
              borderRadius: sizeStyle.borderRadius + 2,
            },
            fullWidth && styles.fullWidth,
            styles.woodShadow,
          ]}
        >
          {/* Inner wood panel with grain effect */}
          <LinearGradient
            colors={[
              colors.wood.medium, 
              colors.wood.light, 
              colors.wood.medium
            ]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[
              styles.button,
              styles.woodInnerButton,
              {
                opacity: disabled ? 0.5 : 1,
                borderRadius: sizeStyle.borderRadius,
                paddingVertical: sizeStyle.paddingVertical,
                paddingHorizontal: sizeStyle.paddingHorizontal,
              },
              fullWidth && styles.fullWidth,
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <View style={styles.contentContainer}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                {typeof children === 'string' ? (
                  <Text style={[textStyles, styles.woodButtonText]}>{children}</Text>
                ) : (
                  children
                )}
                {arrowIcon && (
                  <View style={styles.iconRight}>
                    <Ionicons name="arrow-forward" size={sizeStyle.iconSize} color={colors.onPrimary} />
                  </View>
                )}
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
              </View>
            )}
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({pressed}) => [buttonStyles, pressed && styles.buttonPressed]}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.color} />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {typeof children === 'string' ? (
            <Text style={textStyles}>{children}</Text>
          ) : (
            children
          )}
          {arrowIcon && (
            <View style={styles.iconRight}>
              <Ionicons name="arrow-forward" size={sizeStyle.iconSize} color={variantStyle.color} />
            </View>
          )}
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 64,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    textAlign: 'center',
    fontWeight: '500',
  },
  fullWidth: {
    width: '100%',
  },
  disabledText: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  woodButtonContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 4,
  },
  woodOuterGradient: {
    padding: 2,
    overflow: 'hidden',
  },
  woodInnerButton: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  woodButtonText: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.onPrimary,
  },
  woodShadow: {
    ...createShadow(4),
  },
  buttonShadow: {
    ...createShadow(2),
  },
});

export default Button; 