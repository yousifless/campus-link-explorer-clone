import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { colors, spacing, radius, createShadow } from './theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'wood';
type ToastPosition = 'top' | 'bottom';

interface ToastProps {
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // in ms
  position?: ToastPosition;
  onClose?: () => void;
  visible: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  showIcon?: boolean;
  woodStyle?: boolean;
}

export const Toast = ({
  message,
  description,
  variant = 'default',
  duration = 3000,
  position = 'top',
  onClose,
  visible = false,
  action,
  style,
  showIcon = true,
  woodStyle = false,
}: ToastProps) => {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Apply wood style if requested
  if (woodStyle) variant = 'wood';

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Function to hide toast with animation
  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) onClose();
    });
  };

  // Get appropriate icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />;
      case 'error':
        return <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />;
      case 'warning':
        return <MaterialCommunityIcons name="alert" size={24} color={colors.warning} />;
      case 'info':
        return <MaterialCommunityIcons name="information" size={24} color={colors.info} />;
      case 'wood':
        return <MaterialCommunityIcons name="pine-tree" size={24} color={colors.wood.medium} />;
      default:
        return <MaterialCommunityIcons name="bell" size={24} color={colors.primary} />;
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          borderColor: colors.success,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          icon: 'check-circle',
          iconColor: colors.success,
        };
      case 'error':
        return {
          borderColor: colors.error,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          icon: 'alert-circle',
          iconColor: colors.error,
        };
      case 'warning':
        return {
          borderColor: colors.warning,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          icon: 'alert',
          iconColor: colors.warning,
        };
      case 'info':
        return {
          borderColor: colors.info,
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          icon: 'information',
          iconColor: colors.info,
        };
      case 'wood':
        return {
          borderColor: colors.wood.medium,
          backgroundColor: colors.wood.lightest,
          icon: 'pine-tree',
          iconColor: colors.wood.dark,
        };
      default:
        return {
          borderColor: colors.primary,
          backgroundColor: 'rgba(66, 146, 198, 0.1)',
          icon: 'bell',
          iconColor: colors.primary,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Render null if not visible
  if (!visible) return null;

  // Wood-style toast with special styling
  if (variant === 'wood') {
    return (
      <Animated.View
        style={[
          styles.container,
          styles.woodContainer,
          position === 'top' ? styles.topPosition : styles.bottomPosition,
          {
            transform: [{ translateY }],
            opacity,
          },
          style,
        ]}
      >
        <View style={styles.woodInnerContainer}>
          <View style={styles.contentWrapper}>
            {showIcon && (
              <View style={styles.iconContainer}>
                {getIcon()}
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={styles.woodTitle}>{message}</Text>
              {description && <Text style={styles.woodDescription}>{description}</Text>}
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {action && (
              <TouchableOpacity onPress={action.onPress} style={styles.woodActionButton}>
                <Text style={styles.woodActionText}>{action.label}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={20} color={colors.wood.dark} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Default toast
  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: variantStyles.borderColor,
          backgroundColor: variantStyles.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        style,
      ]}
    >
      <View style={styles.contentWrapper}>
        {showIcon && (
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{message}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {action && (
          <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: variantStyles.iconColor }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={20} color={variantStyles.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ToastProvider manages multiple toasts
export const useToast = () => {
  // This is a placeholder implementation
  // A real implementation would maintain a state of toasts in a Context
  const show = (props: Omit<ToastProps, 'visible'>) => {
    // Logic to show toast
    console.log('Show toast:', props);
  };

  return { show };
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    maxWidth: 500,
    width: '90%',
    alignSelf: 'center',
    ...createShadow(4),
  },
  woodContainer: {
    backgroundColor: colors.wood.lightest,
    borderColor: colors.wood.medium,
    borderWidth: 0,
    ...createShadow(6),
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  woodInnerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderLeftWidth: 4,
    borderLeftColor: colors.wood.dark,
  },
  topPosition: {
    position: 'absolute',
    top: Platform.OS === 'web' ? spacing[8] : spacing[16],
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  bottomPosition: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? spacing[8] : spacing[16],
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.onBackground,
  },
  description: {
    marginTop: spacing[1],
    color: colors.muted,
    fontSize: 14,
  },
  woodTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.wood.dark,
  },
  woodDescription: {
    marginTop: spacing[1],
    color: colors.wood.medium,
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[4],
  },
  actionButton: {
    marginRight: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
  },
  woodActionButton: {
    marginRight: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: colors.wood.dark + '33', // 20% opacity
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  woodActionText: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.wood.dark,
  },
  closeButton: {
    padding: spacing[1],
  },
});

export default Toast; 