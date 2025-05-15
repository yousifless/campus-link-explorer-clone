import React, { useEffect } from 'react';
import { IcebreakerCard } from '@/components/icebreaker/IcebreakerCard';
import { useIcebreakers } from '@/hooks/use-icebreakers';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatIcebreakerProps {
  userA: any;
  userB: any;
  matchId?: string;
}

export const ChatIcebreaker = ({ userA, userB, matchId }: ChatIcebreakerProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { icebreakers, isLoading, generateSuggestions } = useIcebreakers({
    userA,
    userB,
    meetingDate: 'Your next meetup',
    location: 'Campus area'
  });

  // Generate icebreakers when the component mounts
  useEffect(() => {
    if (!icebreakers && !isLoading && userA && userB) {
      generateSuggestions();
    }
  }, [userA, userB, icebreakers, isLoading, generateSuggestions]);

  if (!icebreakers && !isLoading) return null;

  return (
    <div className="mb-4 border rounded-lg overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50">
      <div 
        className="p-3 flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-sm flex items-center gap-2">
          <span className="text-lg">🧊</span>
          <span>Icebreaker suggestions</span>
        </h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <span>Loading suggestions...</span>
                </div>
              ) : icebreakers ? (
                <IcebreakerCard 
                  icebreaker={icebreakers} 
                  showTitle={false}
                  onRefresh={generateSuggestions}
                />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatIcebreaker; 