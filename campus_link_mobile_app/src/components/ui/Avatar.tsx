import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, createShadow, spacing } from './theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'default' | 'circle' | 'rounded' | 'square' | 'wood';

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  spacing?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

interface AvatarProps {
  source?: ImageSourcePropType;
  uri?: string;
  initials?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  variant?: AvatarVariant;
  onPress?: () => void;
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusBorderColor?: string;
  statusPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  woodFrame?: boolean;
}

// Create Avatar Group component to handle avatar grouping
export const AvatarGroup = ({
  children,
  max = 4,
  spacing: spacingProp = -8,
  size = 'md',
  style,
}: AvatarGroupProps) => {
  // Convert children to array
  const childrenArray = React.Children.toArray(children);
  const excess = childrenArray.length - max;
  
  return (
    <View style={[styles.groupContainer, style]}>
      {childrenArray.slice(0, max).map((child, index) => (
        <View 
          key={index} 
          style={{ marginLeft: index === 0 ? 0 : spacingProp }}
        >
          {React.isValidElement(child) ? 
            React.cloneElement(child as React.ReactElement<any>, {
              size,
            }) : child}
        </View>
      ))}
      
      {excess > 0 && (
        <View 
          style={[
            styles.excessContainer, 
            { 
              marginLeft: spacingProp,
              width: getAvatarSize(size),
              height: getAvatarSize(size),
              borderRadius: getAvatarSize(size) / 2,
            }
          ]}
        >
          <Text style={styles.excessText}>+{excess}</Text>
        </View>
      )}
    </View>
  );
};

// Helper functions for avatar sizing
const getAvatarSize = (size: AvatarSize): number => {
  switch (size) {
    case 'xs':
      return 24;
    case 'sm':
      return 32;
    case 'md':
      return 40;
    case 'lg':
      return 48;
    case 'xl':
      return 64;
    case '2xl':
      return 96;
    default:
      return 40;
  }
};

const getFontSize = (size: AvatarSize): number => {
  switch (size) {
    case 'xs':
      return 10;
    case 'sm':
      return 12;
    case 'md':
      return 16;
    case 'lg':
      return 18;
    case 'xl':
      return 24;
    case '2xl':
      return 36;
    default:
      return 16;
  }
};

// Get border radius based on variant
const getBorderRadius = (size: number, variant: AvatarVariant): number => {
  switch (variant) {
    case 'circle':
      return size / 2;
    case 'rounded':
      return size / 4;
    case 'square':
      return 0;
    case 'wood':
    case 'default':
    default:
      return size / 2;
  }
};

export const Avatar = ({
  source,
  uri,
  initials,
  size = 'md',
  style,
  imageStyle,
  textStyle,
  backgroundColor,
  variant = 'default',
  onPress,
  status,
  statusBorderColor = colors.background,
  statusPosition = 'bottom-right',
  woodFrame = false,
}: AvatarProps) => {
  const avatarSize = getAvatarSize(size);
  const fontSize = getFontSize(size);
  const borderRadius = getBorderRadius(avatarSize, variant);

  // Get status indicator position
  const getStatusPosition = () => {
    switch (statusPosition) {
      case 'top-right':
        return { top: 0, right: 0 };
      case 'top-left':
        return { top: 0, left: 0 };
      case 'bottom-left':
        return { bottom: 0, left: 0 };
      case 'bottom-right':
      default:
        return { bottom: 0, right: 0 };
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'away':
        return colors.warning;
      case 'busy':
        return colors.error;
      case 'offline':
      default:
        return colors.muted;
    }
  };

  // Status indicator size based on avatar size
  const statusSize = Math.max(avatarSize / 4, 8);
  
  const AvatarContent = (
    <>
      {(source || uri) ? (
        <Image
          source={source || { uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
            },
            imageStyle,
          ]}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              fontSize,
            },
            textStyle,
          ]}
        >
          {initials || '?'}
        </Text>
      )}

      {status && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: getStatusColor(),
              borderColor: statusBorderColor,
              borderWidth: Math.max(avatarSize / 24, 1),
              ...getStatusPosition(),
            },
          ]}
        />
      )}
    </>
  );

  // Create wood framed avatar if requested
  if (woodFrame || variant === 'wood') {
    return (
      <View style={[styles.woodFrameContainer, style]}>
        <LinearGradient
          colors={[colors.wood.dark, colors.wood.medium, colors.wood.light]}
          style={[
            styles.woodFrame,
            {
              width: avatarSize + spacing[3],
              height: avatarSize + spacing[3],
              borderRadius: borderRadius + spacing[1.5],
              padding: spacing[1.5],
            },
          ]}
        >
          <View
            style={[
              styles.container,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius,
                backgroundColor: backgroundColor || colors.primary,
              },
            ]}
          >
            {AvatarContent}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Wrap in Touchable if onPress provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={style}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.container,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius,
              backgroundColor: backgroundColor || colors.primary,
            },
          ]}
        >
          {AvatarContent}
        </View>
      </TouchableOpacity>
    );
  }

  // Default avatar 
  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius,
          backgroundColor: backgroundColor || colors.primary,
        },
        style,
      ]}
    >
      {AvatarContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  woodFrameContainer: {
    ...createShadow(3),
  },
  woodFrame: {
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(1),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  excessContainer: {
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow(2),
  },
  excessText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
});

// Add AvatarGroup to Avatar component
Avatar.Group = AvatarGroup;

export default Avatar; 