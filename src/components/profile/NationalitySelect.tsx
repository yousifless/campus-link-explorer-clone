
import React, { useState, useEffect } from 'react';
import { Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define a type for nationality data
type Nationality = {
  name: string;
  code: string; // ISO 3166-1 alpha-2 code
};

const NationalitySelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this might be fetched from an API or a separate data file
    const nationalitiesList: Nationality[] = [
      { name: "Japanese", code: "JP" },
      { name: "American", code: "US" },
      { name: "Chinese", code: "CN" },
      { name: "Korean", code: "KR" },
      { name: "Australian", code: "AU" },
      { name: "British", code: "GB" },
      { name: "Canadian", code: "CA" },
      { name: "French", code: "FR" },
      { name: "German", code: "DE" },
      { name: "Indian", code: "IN" },
      { name: "Italian", code: "IT" },
      { name: "Russian", code: "RU" },
      { name: "Brazilian", code: "BR" },
      { name: "Mexican", code: "MX" },
      { name: "Spanish", code: "ES" },
      { name: "Swedish", code: "SE" },
      { name: "Swiss", code: "CH" },
      { name: "Thai", code: "TH" },
      { name: "Vietnamese", code: "VN" },
      { name: "Malaysian", code: "MY" },
      { name: "Filipino", code: "PH" },
      { name: "Indonesian", code: "ID" },
      { name: "Singapore", code: "SG" },
      { name: "New Zealander", code: "NZ" },
      { name: "Irish", code: "IE" },
      // Add more nationalities as needed
    ];
    
    setNationalities(nationalitiesList);
    setLoading(false);
  }, []);

  // Get the flag emoji from country code
  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {value ? (
            <div className="flex items-center">
              {nationalities.find(n => n.name === value)?.code && (
                <span className="mr-2">
                  {getFlagEmoji(nationalities.find(n => n.name === value)?.code || '')}
                </span>
              )}
              {value}
            </div>
          ) : (
            "Select nationality..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search nationality..." />
          <CommandList className="max-h-64 overflow-auto">
            <CommandEmpty>No nationality found.</CommandEmpty>
            <CommandGroup>
              {nationalities.map((nationality) => (
                <CommandItem
                  key={nationality.code}
                  value={nationality.name}
                  onSelect={() => {
                    onChange(nationality.name);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{getFlagEmoji(nationality.code)}</span>
                  {nationality.name}
                  {value === nationality.name && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default NationalitySelect;
