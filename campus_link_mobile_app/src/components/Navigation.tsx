import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, createShadow } from './ui/theme';
import AppIcon from './ui/icons/AppIcon';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface NavigationItemProps {
  icon: string;
  label: string;
  routeName: string;
  onPress: () => void;
  isActive: boolean;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  icon,
  label,
  onPress,
  isActive,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.navItem,
        isActive && styles.navItemActive
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={24} 
        color={isActive ? colors.wood.darkest : colors.onBackground} 
      />
      <Text style={[
        styles.navLabel,
        isActive && styles.navLabelActive
      ]}>
        {label}
      </Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
};

const Navigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;
  const { logout } = useAuth();

  const navItems = [
    { icon: 'view-dashboard', label: 'Dashboard', routeName: 'Dashboard' },
    { icon: 'account-heart', label: 'Matches', routeName: 'Matches' },
    { icon: 'message-text', label: 'Messages', routeName: 'Messages' },
    { icon: 'calendar', label: 'Meetups', routeName: 'Meetups' },
    { icon: 'account', label: 'Profile', routeName: 'Profile' },
  ];

  const handleNavigation = (routeName: string) => {
    // @ts-ignore - navigation.navigate exists
    navigation.navigate(routeName);
  };

  // For mobile, show bottom tab navigation
  if (Platform.OS !== 'web' || width < 768) {
    return (
      <LinearGradient
        colors={[colors.wood.dark, colors.wood.medium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomTabContainer}
      >
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.routeName}
            style={styles.bottomTabItem}
            onPress={() => handleNavigation(item.routeName)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={currentRoute === item.routeName ? colors.onPrimary : 'rgba(255, 255, 255, 0.7)'}
            />
            <Text 
              style={[
                styles.bottomTabLabel, 
                currentRoute === item.routeName && styles.bottomTabLabelActive
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {currentRoute === item.routeName && (
              <View style={styles.bottomTabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </LinearGradient>
    );
  }

  // For web, show sidebar navigation
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.wood.dark, colors.wood.medium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sidebar}
      >
        <View style={styles.logoContainer}>
          <AppIcon size={60} variant="simple" />
          <Text style={styles.logoText}>Campus Link</Text>
        </View>

        <View style={styles.navItems}>
          {navItems.map((item) => (
            <NavigationItem
              key={item.routeName}
              icon={item.icon}
              label={item.label}
              routeName={item.routeName}
              onPress={() => handleNavigation(item.routeName)}
              isActive={currentRoute === item.routeName}
            />
          ))}
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={logout}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={20} 
              color={colors.onPrimary} 
            />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: '100%',
    ...createShadow(5),
    zIndex: 100,
  },
  sidebar: {
    flex: 1,
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logoText: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing[2],
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  navItems: {
    flex: 1,
    paddingHorizontal: spacing[2],
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    borderRadius: radius.md,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...createShadow(2),
  },
  navLabel: {
    marginLeft: spacing[3],
    fontSize: 16,
    fontWeight: '500',
    color: colors.onPrimary,
  },
  navLabelActive: {
    color: colors.wood.darkest,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    width: 4,
    height: '50%',
    backgroundColor: colors.wood.light,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  footerContainer: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: spacing[4],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  logoutText: {
    color: colors.onPrimary,
    marginLeft: spacing[2],
    fontWeight: '500',
  },
  // Bottom Tab Navigation (Mobile)
  bottomTabContainer: {
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    ...createShadow(4),
    // Custom inset shadow for bottom tab
    shadowOffset: { width: 0, height: -2 },
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bottomTabLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  bottomTabLabelActive: {
    color: colors.onPrimary,
    fontWeight: '600',
  },
  bottomTabIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    width: '50%',
    backgroundColor: colors.onPrimary,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
});

export default Navigation; 