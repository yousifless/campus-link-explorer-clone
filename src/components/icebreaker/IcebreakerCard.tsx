import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Activity, 
  Users, 
  RefreshCw, 
  Loader2,
  MessageCircle, 
  Lightbulb 
} from 'lucide-react';
import { IcebreakerResponse } from '@/utils/icebreaker/icebreaker-service';

interface IcebreakerCardProps {
  icebreaker: IcebreakerResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  showTitle?: boolean;
  className?: string;
}

export const IcebreakerCard = ({ 
  icebreaker, 
  isLoading = false, 
  onRefresh, 
  showTitle = true,
  className = ''
}: IcebreakerCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`bg-muted/50 hover:bg-muted/80 transition-all duration-300 ${className}`}>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
            <span>Icebreaker Suggestions</span>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-sm text-muted-foreground">
              Generating icebreakers...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center">
                <MessageCircle className="h-4 w-4 mr-1 text-indigo-600" />
                <span>Conversation Starters</span>
              </h3>
              <ul className="space-y-2">
                {icebreaker.conversationStarters.map((starter, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-sm bg-background p-2 rounded-md border"
                  >
                    {starter}
                  </motion.li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-1 text-emerald-600" />
                <span>Mini-Activity</span>
              </h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm mt-1 bg-background p-2 rounded-md border"
              >
                {icebreaker.activity}
              </motion.p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-1 text-blue-600" />
                <span>Shared Topic</span>
              </h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm mt-1 bg-background p-2 rounded-md border"
              >
                {icebreaker.sharedTopic}
              </motion.p>
            </div>
            
            {/* Show full response toggle */}
            {icebreaker.rawResponse && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Hide Full Response" : "Show Full Response"}
                </Button>
                
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="text-xs mt-2 bg-gray-50 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                        {icebreaker.rawResponse}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {onRefresh && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh Icebreakers
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IcebreakerCard; 