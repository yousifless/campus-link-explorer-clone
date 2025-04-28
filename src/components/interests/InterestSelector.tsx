import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Define the Interest type
type Interest = {
  id: string;
  name: string;
  category: string;
};

interface InterestSelectorProps {
  selectedInterests: string[];
  onInterestChange: (interests: string[]) => void;
  maxInterests?: number;
}

const InterestSelector: React.FC<InterestSelectorProps> = ({
  selectedInterests,
  onInterestChange,
  maxInterests = 10
}) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch interests from the database
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('interests')
          .select('*')
          .order('category, name');

        if (error) {
          console.error('Error fetching interests:', error);
          return;
        }

        if (data) {
          setInterests(data);
          
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(data.map(interest => interest.category)));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  // Handle interest toggle
  const handleInterestToggle = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      // Remove interest if already selected
      onInterestChange(selectedInterests.filter(id => id !== interestId));
    } else {
      // Add interest if not at max limit
      if (selectedInterests.length < maxInterests) {
        onInterestChange([...selectedInterests, interestId]);
      }
    }
  };

  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Arts & Crafts':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Music':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Sports & Fitness':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Technology & Gaming':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'Food & Drink':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Travel & Adventure':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Literature & Writing':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      case 'Science & Education':
        return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
      case 'Nature & Outdoors':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'Fashion & Beauty':
        return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
      case 'Movies & TV':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Social & Community':
        return 'bg-teal-100 text-teal-800 hover:bg-teal-200';
      case 'Mindfulness & Well-being':
        return 'bg-lime-100 text-lime-800 hover:bg-lime-200';
      case 'History & Culture':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'Business & Finance':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
      case 'Pets & Animals':
        return 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading interests...</div>;
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={categories[0] || ''} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="flex flex-wrap gap-2">
              {interests
                .filter(interest => interest.category === category)
                .map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <Badge
                      key={interest.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${isSelected ? 'bg-primary text-primary-foreground' : getCategoryColor(category)}`}
                      onClick={() => handleInterestToggle(interest.id)}
                    >
                      {interest.name}
                      {isSelected && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {selectedInterests.length}/{maxInterests} interests selected
      </div>
    </div>
  );
};

export default InterestSelector; 