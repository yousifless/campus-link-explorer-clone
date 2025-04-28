import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SelectedInterestsProps {
  selectedInterests: string[];
  onRemoveInterest: (interestId: string) => void;
  className?: string;
}

type Interest = {
  id: string;
  name: string;
  category: string;
};

const SelectedInterests: React.FC<SelectedInterestsProps> = ({
  selectedInterests,
  onRemoveInterest,
  className = ''
}) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch interests from the database
  useEffect(() => {
    const fetchInterests = async () => {
      if (selectedInterests.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('interests')
          .select('*')
          .in('id', selectedInterests);

        if (error) {
          console.error('Error fetching interests:', error);
          return;
        }

        if (data) {
          setInterests(data);
        }
      } catch (error) {
        console.error('Error fetching interests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [selectedInterests]);

  if (loading) {
    return <div className="text-center py-2">Loading selected interests...</div>;
  }

  if (selectedInterests.length === 0) {
    return (
      <div className={`text-center py-4 text-muted-foreground ${className}`}>
        No interests selected yet. Select some interests to get started!
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {interests.map((interest) => (
        <Badge
          key={interest.id}
          variant="default"
          className="flex items-center gap-1 px-3 py-1"
        >
          {interest.name}
          <button
            onClick={() => onRemoveInterest(interest.id)}
            className="ml-1 rounded-full hover:bg-primary-foreground/20 p-0.5"
          >
            <X size={12} />
          </button>
        </Badge>
      ))}
    </div>
  );
};

export default SelectedInterests; 