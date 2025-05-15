import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
  Animated,
} from 'react-native';
import { colors, createShadow, radius, spacing } from './theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  description?: string;
  woodStyle?: boolean;
  variant?: 'default' | 'outlined' | 'filled' | 'wood';
  required?: boolean;
  helperText?: string;
}

export const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  rightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  description,
  woodStyle = false,
  variant = 'default',
  required = false,
  helperText,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [borderColorAnim] = useState(new Animated.Value(0));

  // Apply animation when focus changes
  React.useEffect(() => {
    Animated.timing(borderColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderColorAnim]);

  // Get the variant style to use
  const getVariantStyle = () => {
    if (woodStyle) return styles.woodInputContainer;
    
    switch (variant) {
      case 'outlined':
        return styles.outlinedInputContainer;
      case 'filled':
        return styles.filledInputContainer;
      case 'wood':
        return styles.woodInputContainer;
      default:
        return styles.defaultInputContainer;
    }
  };

  // Animation interpolation for border color
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : (woodStyle ? colors.wood.medium : colors.border),
      error ? colors.error : (woodStyle ? colors.wood.dark : colors.primary)
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label, 
            woodStyle && styles.woodLabel, 
            isFocused && styles.focusedLabel,
            error && styles.errorLabel,
            labelStyle
          ]}>
            {label}
            {required && <Text style={styles.requiredAsterisk}>*</Text>}
          </Text>
        </View>
      )}
      
      <Animated.View style={[
        styles.inputContainer,
        getVariantStyle(),
        {
          borderColor: borderColor,
          borderWidth: isFocused ? 2 : 1,
          transform: [{ translateY: isFocused ? -1 : 0 }]
        },
        error ? styles.inputError : null
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            woodStyle && styles.woodInput,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            isFocused && styles.inputFocused,
            inputStyle,
          ]}
          placeholderTextColor={woodStyle ? colors.wood.medium : colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={rightIconPress}
            disabled={!rightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
        
        {error && !rightIcon && (
          <View style={styles.errorIcon}>
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={20} 
              color={colors.error} 
            />
          </View>
        )}
      </Animated.View>
      
      {(error || helperText) && (
        <Text 
          style={[
            styles.helperText, 
            error ? styles.error : styles.description, 
            woodStyle && (error ? styles.woodError : styles.woodDescription),
            errorStyle
          ]}
        >
          {error || helperText}
        </Text>
      )}
      
      {description && !error && !helperText && (
        <Text style={[styles.description, woodStyle && styles.woodDescription]}>
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: spacing[1.5],
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onBackground,
  },
  requiredAsterisk: {
    color: colors.error,
    marginLeft: 2,
  },
  woodLabel: {
    color: colors.wood.dark,
    fontWeight: '600',
  },
  focusedLabel: {
    color: colors.primary,
  },
  errorLabel: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  defaultInputContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    ...createShadow(1),
  },
  outlinedInputContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  filledInputContainer: {
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceVariant,
  },
  woodInputContainer: {
    backgroundColor: colors.wood.lightest,
    borderColor: colors.wood.medium,
    borderWidth: 1,
    ...createShadow(2),
  },
  input: {
    flex: 1,
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    fontSize: 16,
    color: colors.onBackground,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  woodInput: {
    color: colors.wood.darkest,
  },
  inputFocused: {
    color: colors.wood.darkest,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[1],
  },
  inputWithRightIcon: {
    paddingRight: spacing[1],
  },
  leftIcon: {
    paddingLeft: spacing[3],
  },
  rightIcon: {
    paddingRight: spacing[3],
  },
  errorIcon: {
    paddingRight: spacing[3],
  },
  inputError: {
    borderColor: colors.error,
  },
  helperText: {
    fontSize: 12,
    marginTop: spacing[1],
    marginLeft: spacing[0.5],
  },
  error: {
    color: colors.error,
  },
  woodError: {
    color: colors.error,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing[1],
  },
  woodDescription: {
    color: colors.wood.medium,
  },
});

export default Input; 