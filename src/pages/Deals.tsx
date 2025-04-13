
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/enhanced-client';
import { DealType } from '@/types/database';
import DealCard from '@/components/deals/DealCard';
import DealFilters from '@/components/deals/DealFilters';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Mock data for now
const MOCK_DEALS: DealType[] = [
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

const Deals = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const { toast } = useToast();

  // This would be replaced with real API call in production
  const { data: deals = MOCK_DEALS, isLoading } = useQuery({
    queryKey: ['deals', selectedCategory],
    queryFn: async () => {
      // In a real app, this would be fetching from Supabase
      // const { data, error } = await db.deals()
      //  .select('*')
      //  .eq(selectedCategory ? 'category' : '', selectedCategory || '')
      
      // Filter mock data based on selected category
      if (selectedCategory) {
        return MOCK_DEALS.filter(deal => deal.category === selectedCategory);
      }
      return MOCK_DEALS;
    }
  });

  const enableLocationServices = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationEnabled(true);
          toast({
            title: "Location enabled",
            description: "We'll show you nearby deals.",
          });
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Unable to access location",
            description: "Please enable location services in your browser.",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
      });
    }
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Local Deals</h1>
          <p className="text-muted-foreground">
            Exclusive discounts for students at local businesses near campus
          </p>
        </div>

        {!locationEnabled && (
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="text-sm">Enable location to see deals near you</p>
            </div>
            <Button size="sm" onClick={enableLocationServices}>
              Enable Location
            </Button>
          </div>
        )}

        <DealFilters selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse h-[340px] rounded-lg"></div>
            ))}
          </div>
        ) : (
          <>
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No deals found. Try changing your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Deals;
