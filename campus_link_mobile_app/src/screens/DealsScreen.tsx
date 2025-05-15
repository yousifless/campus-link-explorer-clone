import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, colors, createShadow, spacing, radius } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AppIcon from '../components/ui/icons/AppIcon';

const { width } = Dimensions.get('window');

// Extend the campus colors with missing colors we need
const extendedColors = {
  ...colors,
  white: '#FFFFFF', // Add white color
  campus: {
    ...colors.campus,
    yellow: '#F59E0B', // Same as accent color
    purple: '#8B5CF6', // Purple color for exclusive badge
    red: '#EF4444', // Red color for discount badge
    green: '#22C55E', // Green color for success indicators
  }
};

// Mock data for now, would be replaced with real API call
const MOCK_DEALS = [
  {
    id: '1',
    business_name: 'Sakura Coffee',
    category: 'cafe',
    discount_percentage: 20,
    description: 'Enjoy 20% off any coffee drink with your student ID.',
    expiration_date: '2025-05-30',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f0b825a6dfde?q=80&w=500',
    location: 'Shibuya, Tokyo',
    is_exclusive: true,
    redemption_code: 'STUDENT20',
    average_rating: 4.5,
    review_count: 28,
    coordinates: {
      latitude: 35.658517,
      longitude: 139.701334
    }
  },
  {
    id: '2',
    business_name: 'Tokyo Books',
    category: 'bookstore',
    discount_percentage: 15,
    description: 'Get 15% off on all English language books.',
    expiration_date: '2025-06-15',
    image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=500',
    location: 'Shinjuku, Tokyo',
    is_exclusive: false,
    redemption_code: 'ENGBOOKS15',
    average_rating: 4.2,
    review_count: 15,
    coordinates: {
      latitude: 35.690921,
      longitude: 139.700256
    }
  },
  {
    id: '3',
    business_name: 'Ramen Ichiban',
    category: 'restaurant',
    discount_percentage: 10,
    description: 'Student discount: 10% off your meal during weekdays.',
    expiration_date: '2025-07-01',
    image_url: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=500',
    location: 'Ikebukuro, Tokyo',
    is_exclusive: false,
    redemption_code: 'RAMEN10',
    average_rating: 4.7,
    review_count: 42,
    coordinates: {
      latitude: 35.729503,
      longitude: 139.710999
    }
  }
];

// Category options with valid MaterialCommunityIcons names
const CATEGORIES = [
  { id: 'all', name: 'All Deals', icon: 'tag-multiple' as const },
  { id: 'cafe', name: 'Cafes', icon: 'coffee' as const },
  { id: 'restaurant', name: 'Restaurants', icon: 'food' as const },
  { id: 'bookstore', name: 'Bookstores', icon: 'book-open-variant' as const },
  { id: 'entertainment', name: 'Entertainment', icon: 'ticket' as const },
  { id: 'shopping', name: 'Shopping', icon: 'shopping' as const },
];

const DealsScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [loading, setLoading] = useState(false);

  // Request location permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
    })();
  }, []);

  // Filter deals when category changes
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      if (selectedCategory && selectedCategory !== 'all') {
        setDeals(MOCK_DEALS.filter(deal => deal.category === selectedCategory));
      } else {
        setDeals(MOCK_DEALS);
      }
      setLoading(false);
    }, 500); // Simulate API call delay
  }, [selectedCategory]);

  const enableLocationServices = async () => {
    try {
      if (locationPermission !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setLocationEnabled(true);
      // In a real app, we would use the location to sort deals by proximity
    } catch (error) {
      console.log('Error getting location', error);
    }
  };

  // Render a single deal card
  const renderDealCard = (deal: typeof MOCK_DEALS[0]) => (
    <Card variant="wood" style={styles.dealCard} key={deal.id}>
      <View style={styles.cardImageContainer}>
        <Image 
          source={{ uri: deal.image_url }} 
          style={styles.cardImage} 
          resizeMode="cover"
        />
        {deal.is_exclusive && (
          <View style={styles.exclusiveBadge}>
            <Text style={styles.exclusiveText}>EXCLUSIVE</Text>
          </View>
        )}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{deal.discount_percentage}% OFF</Text>
        </View>
      </View>
      
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.businessName}>{deal.business_name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color={extendedColors.campus.yellow} />
            <Text style={styles.ratingText}>{deal.average_rating} ({deal.review_count})</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.wood.dark} />
          <Text style={styles.locationText}>{deal.location}</Text>
        </View>
        
        <Text style={styles.description}>{deal.description}</Text>
        
        <View style={styles.expirationRow}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.wood.dark} />
          <Text style={styles.expirationText}>Expires: {new Date(deal.expiration_date).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Redemption Code:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{deal.redemption_code}</Text>
          </View>
        </View>
        
        <Button 
          variant="campus" 
          size="default"
          style={styles.redeemButton}
        >
          Redeem Now
        </Button>
      </Card.Content>
    </Card>
  );

  // Render category filter buttons
  const renderCategoryFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {CATEGORIES.map(category => (
        <TouchableOpacity 
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.selectedCategoryButton
          ]}
          onPress={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
        >
          <MaterialCommunityIcons 
            name={category.icon} 
            size={18} 
            color={selectedCategory === category.id ? extendedColors.white : colors.wood.dark} 
          />
          <Text 
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.selectedCategoryText
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Wood texture background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[
            colors.gradients.woodVertical[0],
            colors.gradients.woodVertical[1],
            colors.gradients.woodVertical[2]
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Overlay pattern for wood grain texture */}
          <View style={styles.woodGrainOverlay} />
        </LinearGradient>
        
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <AppIcon size={40} />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>
              Local Deals
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Exclusive discounts for students near campus
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {!locationEnabled && (
            <View style={styles.locationPrompt}>
              <View style={styles.locationPromptContent}>
                <MaterialCommunityIcons name="map-marker" size={22} color={colors.campus.blue} />
                <Text style={styles.locationPromptText}>Enable location to see deals near you</Text>
              </View>
              <Button 
                variant="campus" 
                size="sm"
                onPress={enableLocationServices}
              >
                Enable Location
              </Button>
            </View>
          )}

          {renderCategoryFilters()}

          {loading ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="loading" size={24} color={colors.campus.blue} />
              <Text style={styles.loadingText}>Loading deals...</Text>
            </View>
          ) : deals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No deals found. Try changing your filters.</Text>
            </View>
          ) : (
            <View style={styles.dealsGrid}>
              {deals.map(deal => renderDealCard(deal))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.wood.dark,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  woodGrainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    // Linear pattern that mimics wood grain
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 8px)' 
      : undefined,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.4,
    left: -width * 0.3,
    transform: [{ rotate: '-15deg' }],
  },
  circle2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.3,
    right: -width * 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  headerTextContainer: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  title: {
    fontWeight: 'bold',
    color: colors.onPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: colors.wood.lightest,
    marginTop: spacing[1],
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  locationPrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  locationPromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPromptText: {
    color: colors.wood.lightest,
    marginLeft: spacing[2],
  },
  categoriesContainer: {
    paddingBottom: spacing[4],
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wood.lightest,
    borderRadius: radius.pill,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginRight: spacing[2],
    ...createShadow(1),
  },
  selectedCategoryButton: {
    backgroundColor: colors.campus.blue,
  },
  categoryText: {
    marginLeft: spacing[1],
    color: colors.wood.dark,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: extendedColors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  loadingText: {
    color: colors.wood.lightest,
    marginLeft: spacing[2],
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  emptyText: {
    color: colors.wood.lightest,
    textAlign: 'center',
  },
  dealsGrid: {
    gap: spacing[4],
  },
  dealCard: {
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...createShadow(3),
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    backgroundColor: extendedColors.campus.purple,
    borderRadius: radius.sm,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  exclusiveText: {
    color: extendedColors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: extendedColors.campus.red,
    borderRadius: radius.sm,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  discountText: {
    color: extendedColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  businessName: {
    fontWeight: 'bold',
    color: colors.wood.darkest,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing[1],
    color: colors.wood.dark,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  locationText: {
    marginLeft: spacing[1],
    color: colors.wood.dark,
    fontSize: 14,
  },
  description: {
    color: colors.wood.dark,
    marginBottom: spacing[3],
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  expirationText: {
    marginLeft: spacing[1],
    color: colors.wood.dark,
    fontSize: 14,
  },
  codeContainer: {
    marginBottom: spacing[3],
  },
  codeLabel: {
    color: colors.wood.dark,
    marginBottom: spacing[1],
  },
  codeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.sm,
    padding: spacing[2],
    alignItems: 'center',
  },
  codeText: {
    fontWeight: 'bold',
    letterSpacing: 1,
    color: colors.wood.darkest,
  },
  redeemButton: {
    width: '100%',
  },
});

export default DealsScreen; 