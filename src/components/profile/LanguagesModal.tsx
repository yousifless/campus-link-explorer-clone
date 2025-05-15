
import React, { useState, useEffect } from 'react';
import { Check, Languages, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/types/database';

type LanguagesModalProps = {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  userLanguages?: { id: string; name: string; proficiency: string }[];
  onSave: (languages: { id: string; name: string; proficiency: string }[]) => void;
};

type LanguagesByRegion = {
  [region: string]: Language[];
};

// We need to add region to our Language type if it doesn't exist
interface LanguageWithRegion extends Language {
  region?: string;
}

const LanguagesModal: React.FC<LanguagesModalProps> = ({ open, onOpenChange, userLanguages = [], onSave }) => {
  const [languagesByRegion, setLanguagesByRegion] = useState<LanguagesByRegion>({});
  const [filteredLanguagesByRegion, setFilteredLanguagesByRegion] = useState<LanguagesByRegion>({});
  const [selectedLanguages, setSelectedLanguages] = useState<{ id: string; name: string; proficiency: string }[]>(userLanguages);
  const [searchTerm, setSearchTerm] = useState('');

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'native'];

  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase.from('languages').select('*');
      
      if (error) {
        console.error('Error fetching languages:', error);
        return;
      }
      
      if (data) {
        // Group languages by region with proper type safety
        const languagesByRegion = data.reduce<LanguagesByRegion>((acc, language: LanguageWithRegion) => {
          // Use a default region if region field doesn't exist
          const region = language.region || 'Other';
          if (!acc[region]) {
            acc[region] = [];
          }
          acc[region].push(language);
          return acc;
        }, {});
        
        setLanguagesByRegion(languagesByRegion);
        setFilteredLanguagesByRegion(languagesByRegion);
      }
    };
    
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered: LanguagesByRegion = {};
      Object.keys(languagesByRegion).forEach(region => {
        const filteredLanguages = languagesByRegion[region].filter(lang =>
          lang.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredLanguages.length > 0) {
          filtered[region] = filteredLanguages;
        }
      });
      setFilteredLanguagesByRegion(filtered);
    } else {
      setFilteredLanguagesByRegion(languagesByRegion);
    }
  }, [searchTerm, languagesByRegion]);

  const handleLanguageSelection = (language: Language, proficiency: string) => {
    const isSelected = selectedLanguages.some(lang => lang.id === language.id);
    
    if (isSelected) {
      setSelectedLanguages(prev => prev.filter(lang => lang.id !== language.id));
    } else {
      setSelectedLanguages(prev => [...prev, { id: language.id, name: language.name, proficiency }]);
    }
  };

  const handleProficiencyChange = (languageId: string, proficiency: string) => {
    setSelectedLanguages(prev =>
      prev.map(lang =>
        lang.id === languageId ? { ...lang, proficiency } : lang
      )
    );
  };

  const isLanguageSelected = (languageId: string) => {
    return selectedLanguages.some(lang => lang.id === languageId);
  };

  const getLanguageProficiency = (languageId: string) => {
    const language = selectedLanguages.find(lang => lang.id === languageId);
    return language ? language.proficiency : 'intermediate';
  };

  const handleSaveLanguages = () => {
    onSave(selectedLanguages);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Languages</DialogTitle>
          <DialogDescription>
            Select the languages you speak and your proficiency level.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="relative">
            <Input
              placeholder="Type to filter languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] w-full rounded-md border">
            {Object.keys(filteredLanguagesByRegion).length > 0 ? (
              Object.entries(filteredLanguagesByRegion).map(([region, languages]) => (
                <div key={region} className="p-3">
                  <h4 className="mb-2 font-semibold text-sm">{region}</h4>
                  {languages.map(language => (
                    <div key={language.id} className="flex items-center justify-between py-2">
                      <Label htmlFor={language.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={language.id}
                          className="h-4 w-4 rounded accent-indigo-500"
                          checked={isLanguageSelected(language.id)}
                          onChange={() => handleLanguageSelection(language, getLanguageProficiency(language.id))}
                        />
                        <span>{language.name}</span>
                      </Label>
                      {isLanguageSelected(language.id) && (
                        <Select value={getLanguageProficiency(language.id)} onValueChange={(value) => handleProficiencyChange(language.id, value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select proficiency" />
                          </SelectTrigger>
                          <SelectContent>
                            {proficiencyLevels.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No languages found.</div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveLanguages}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagesModal;
