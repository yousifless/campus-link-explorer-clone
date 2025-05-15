import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Search, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Interest {
  id: string;
  name: string;
  category?: string;
}

interface InterestsByCategory {
  [category: string]: Interest[];
}

interface InterestsModalProps {
  onSave: (interests: Interest[]) => Promise<void>;
  userInterests?: Interest[];
}

export const InterestsModal = ({ onSave, userInterests = [] }: InterestsModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allInterests, setAllInterests] = useState<InterestsByCategory>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(userInterests);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchInterests = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('interests')
          .select('id, name, category')
          .order('name');
        
        if (error) throw error;
        
        // Group interests by category
        const interestsByCategory = (data || []).reduce((acc: InterestsByCategory, interest: Interest) => {
          const category = interest.category || 'Other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(interest);
          return acc;
        }, {});
        
        setAllInterests(interestsByCategory);
        setCategories(Object.keys(interestsByCategory).sort());
      } catch (error) {
        console.error('Error fetching interests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load interests',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchInterests();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (userInterests) {
      setSelectedInterests(userInterests);
    }
  }, [userInterests]);

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests(prev => {
      const exists = prev.some(i => i.id === interest.id);
      
      if (exists) {
        return prev.filter(i => i.id !== interest.id);
      } else {
        return [...prev, interest];
      }
    });
  };

  const isInterestSelected = (id: string) => {
    return selectedInterests.some(interest => interest.id === id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedInterests);
      toast({
        title: 'Success',
        description: 'Your interests have been updated',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving interests:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your interests',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredInterests = (category: string) => {
    const interests = allInterests[category] || [];
    
    if (!searchQuery.trim()) {
      return interests;
    }
    
    return interests.filter(interest => 
      interest.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Edit Interests
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose Your Interests</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <p className="text-sm font-medium mr-2 py-1">Selected:</p>
              {selectedInterests.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-1">No interests selected</p>
              ) : (
                <AnimatePresence>
                  {selectedInterests.map(interest => (
                    <motion.div
                      key={interest.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Badge 
                        variant="outline"
                        className="group bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest.name}
                        <span className="ml-1 group-hover:bg-indigo-200 rounded-full h-4 w-4 inline-flex items-center justify-center">×</span>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue={categories[0]} className="h-full flex flex-col">
                <TabsList className="mb-4 overflow-x-auto flex-nowrap justify-start max-w-full">
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <ScrollArea className="flex-1 pr-3">
                  {categories.map(category => (
                    <TabsContent key={category} value={category} className="mt-0 h-full">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredInterests(category).map(interest => (
                          <motion.div
                            key={interest.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              variant="outline"
                              className={`w-full justify-start text-left ${
                                isInterestSelected(interest.id) 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                                  : ''
                              }`}
                              onClick={() => toggleInterest(interest)}
                            >
                              {isInterestSelected(interest.id) && (
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                              )}
                              <span className="truncate">{interest.name}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>
            </div>
          </>
        )}
        
        <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Interests
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterestsModal; 