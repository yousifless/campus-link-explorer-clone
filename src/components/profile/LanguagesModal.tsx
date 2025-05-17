import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Check, Search, Save, Loader2, X, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Language {
  id: string;
  name: string;
  region?: string;
  proficiency?: string;
}

interface UserLanguage extends Language {
  proficiency: string;
}

interface LanguagesByRegion {
  [region: string]: Language[];
}

interface LanguagesModalProps {
  onSave: (languages: UserLanguage[]) => Promise<void>;
  userLanguages?: UserLanguage[];
}

const proficiencyLevels = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'beginner', label: 'Beginner' }
];

export const LanguagesModal = ({ onSave, userLanguages = [] }: LanguagesModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [allLanguages, setAllLanguages] = useState<LanguagesByRegion>({});
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<UserLanguage[]>(userLanguages);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('id, name, region')
          .order('name');
        
        if (error) throw error;
        
        // Group languages by region
        const languagesByRegion = (data || []).reduce((acc: LanguagesByRegion, language: Language) => {
          const region = language.region || 'Global';
          if (!acc[region]) {
            acc[region] = [];
          }
          acc[region].push(language);
          return acc;
        }, {});
        
        setAllLanguages(languagesByRegion);
        // Ensure "Global" appears first if it exists
        const sortedRegions = Object.keys(languagesByRegion).sort((a, b) => {
          if (a === 'Global') return -1;
          if (b === 'Global') return 1;
          return a.localeCompare(b);
        });
        setRegions(sortedRegions);
      } catch (error) {
        console.error('Error fetching languages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load languages',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchLanguages();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (userLanguages) {
      setSelectedLanguages(userLanguages);
    }
  }, [userLanguages]);

  const addLanguage = (language: Language) => {
    setSelectedLanguages(prev => {
      const exists = prev.some(l => l.id === language.id);
      
      if (exists) return prev;
      
      return [...prev, { ...language, proficiency: 'intermediate' }];
    });
  };

  const removeLanguage = (id: string) => {
    setSelectedLanguages(prev => prev.filter(lang => lang.id !== id));
  };

  const updateProficiency = (id: string, proficiency: string) => {
    setSelectedLanguages(prev => 
      prev.map(lang => 
        lang.id === id ? { ...lang, proficiency } : lang
      )
    );
  };

  const isLanguageSelected = (id: string) => {
    return selectedLanguages.some(lang => lang.id === id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedLanguages);
      toast({
        title: 'Success',
        description: 'Your languages have been updated',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving languages:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your languages',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredLanguages = (region: string) => {
    const languages = allLanguages[region] || [];
    
    if (!searchQuery.trim()) {
      return languages;
    }
    
    return languages.filter(language => 
      language.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Edit Languages
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Your Languages</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search languages..."
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
            {/* Selected languages with proficiency */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Selected Languages</h3>
              {selectedLanguages.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No languages selected</p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {selectedLanguages.map(lang => (
                      <motion.div
                        key={lang.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-medium">{lang.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Select 
                            value={lang.proficiency}
                            onValueChange={(value) => updateProficiency(lang.id, value)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder="Select proficiency" />
                            </SelectTrigger>
                            <SelectContent>
                              {proficiencyLevels.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 h-8 w-8 p-0"
                            onClick={() => removeLanguage(lang.id)}
                          >
                            <X className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Language selection tabs */}
            <div className="flex-1 overflow-hidden border rounded-md">
              <Tabs defaultValue={regions[0]} className="h-full flex flex-col">
                <TabsList className="px-4 pt-2 overflow-x-auto flex-nowrap justify-start max-w-full border-b h-auto rounded-none">
                  {regions.map(region => (
                    <TabsTrigger key={region} value={region} className="rounded-t-md rounded-b-none">
                      {region}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <ScrollArea className="flex-1 p-4">
                  {regions.map(region => (
                    <TabsContent key={region} value={region} className="mt-0 h-full">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredLanguages(region).map(language => (
                          <motion.div
                            key={language.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              variant="outline"
                              className={`w-full justify-start text-left ${
                                isLanguageSelected(language.id) 
                                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                                  : ''
                              }`}
                              onClick={() => addLanguage(language)}
                              disabled={isLanguageSelected(language.id)}
                            >
                              {isLanguageSelected(language.id) ? (
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                              ) : (
                                <Globe className="h-4 w-4 mr-2 text-gray-400" />
                              )}
                              <span className="truncate">{language.name}</span>
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
                Save Languages
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagesModal; 