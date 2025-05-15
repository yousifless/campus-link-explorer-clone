import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Image, Pressable } from 'react-native';
import { colors, createShadow, radius, spacing } from './theme';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
  woodStyle?: boolean;
  variant?: 'default' | 'outline' | 'wood' | 'elevated';
  onPress?: () => void;
  interactive?: boolean;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  right?: React.ReactNode;
  woodStyle?: boolean;
  center?: boolean;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardImageProps {
  source: any;
  style?: ViewStyle;
  imageStyle?: any;
  height?: number;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
  Image: React.FC<CardImageProps>;
  Description: React.FC<CardDescriptionProps>;
  Title: React.FC<CardTitleProps>;
} = ({ children, style, transparent = false, woodStyle = false, variant = 'default', onPress, interactive = false }) => {
  
  // Get variant styling
  const getCardStyle = () => {
    if (woodStyle || variant === 'wood') {
      return styles.woodCardContainer;
    }
    
    switch (variant) {
      case 'outline':
        return styles.outlineCard;
      case 'elevated':
        return styles.elevatedCard;
      default:
        return transparent ? styles.transparentCard : styles.defaultCard;
    }
  };
  
  // If card is wood style
  if (woodStyle || variant === 'wood') {
    const cardContent = (
      <View style={[styles.woodCardContainer, style]}>
        {/* Wood frame design */}
        <LinearGradient
          colors={[
            colors.wood.dark, 
            colors.wood.medium, 
            colors.wood.light,
          ]}
          style={styles.woodGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.woodInnerCard}>
            {children}
          </View>
        </LinearGradient>
      </View>
    );
    
    // Make card interactive if onPress is provided
    if (onPress) {
      return (
        <Pressable 
          onPress={onPress}
          style={({ pressed }) => [
            { opacity: pressed ? 0.9 : 1 },
            { transform: [{ scale: pressed ? 0.99 : 1 }] }
          ]}
        >
          {cardContent}
        </Pressable>
      );
    }
    
    return cardContent;
  }

  // Regular card
  const cardContent = (
    <View
      style={[
        styles.card,
        getCardStyle(),
        interactive && styles.interactiveCard,
        style,
      ]}
    >
      {children}
    </View>
  );
  
  // Make card interactive if onPress is provided
  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.95 : 1 },
          interactive && pressed ? styles.cardPressed : null
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }
  
  return cardContent;
};

Card.Header = ({ title, subtitle, style, titleStyle, subtitleStyle, right, woodStyle = false, center = false }) => {
  if (woodStyle) {
    return (
      <LinearGradient
        colors={[colors.wood.medium, colors.wood.light, colors.wood.medium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header, 
          styles.woodHeader, 
          center && styles.centerHeader,
          style
        ]}
      >
        <View style={[
          styles.headerTextContainer, 
          center && styles.centerHeaderText
        ]}>
          <Text style={[styles.title, styles.woodTitle, titleStyle]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, styles.woodSubtitle, subtitleStyle]}>{subtitle}</Text>}
        </View>
        {right && <View style={styles.headerRight}>{right}</View>}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.header, 
      center && styles.centerHeader,
      style
    ]}>
      <View style={[
        styles.headerTextContainer,
        center && styles.centerHeaderText
      ]}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.headerRight}>{right}</View>}
    </View>
  );
};

Card.Content = ({ children, style }) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

Card.Footer = ({ children, style }) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

Card.Image = ({ source, style, imageStyle, height = 180 }) => {
  return (
    <View style={[styles.imageContainer, { height }, style]}>
      <Image 
        source={source} 
        style={[styles.image, imageStyle]} 
        resizeMode="cover"
      />
    </View>
  );
};

Card.Description = ({ children, style }) => {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
};

Card.Title = ({ children, style }) => {
  return (
    <Text style={[styles.cardTitle, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginVertical: spacing[2],
  },
  defaultCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...createShadow(2),
  },
  outlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'transparent',
    elevation: 0,
  },
  elevatedCard: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    ...createShadow(4),
  },
  transparentCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  interactiveCard: {
    ...createShadow(2),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  woodCardContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginVertical: spacing[3],
    ...createShadow(6),
  },
  woodGradient: {
    borderRadius: radius.lg - 2,
    padding: 3,
  },
  woodInnerCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.lg - 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  centerHeader: {
    justifyContent: 'center',
  },
  centerHeaderText: {
    alignItems: 'center',
    textAlign: 'center',
  },
  woodHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.wood.dark,
    paddingVertical: spacing[4.5],
  },
  headerTextContainer: {
    flex: 1,
  },
  headerRight: {
    marginLeft: spacing[4],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onBackground,
  },
  woodTitle: {
    color: colors.onPrimary,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  woodSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  content: {
    padding: spacing[4],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onBackground,
    marginBottom: spacing[1],
  },
});

export default Card; 