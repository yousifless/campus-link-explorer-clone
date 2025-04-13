
import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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

type SearchableSelectProps = {
  options: Array<{ id: string; name: string; category?: string; code?: string; }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyMessage?: string;
  disabled?: boolean;
  groupBy?: 'category' | 'none';
  maxHeight?: string;
  renderOption?: (option: any) => React.ReactNode;
};

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage = "No results found",
  disabled = false,
  groupBy = 'none',
  maxHeight = "max-h-64",
  renderOption
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find(option => option.id === value);
  
  const groupedOptions = groupBy === 'category' 
    ? options.reduce((acc, option) => {
        const category = option.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(option);
        return acc;
      }, {} as Record<string, typeof options>)
    : { 'All': options };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value ? (
            selectedOption ? (
              renderOption ? renderOption(selectedOption) : selectedOption.name
            ) : placeholder
          ) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              className="h-9 w-full flex-1 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList className={maxHeight}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groupBy === 'none' ? (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => {
                      onChange(option.id);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <span>{option.name}</span>
                    )}
                    {option.id === value && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              Object.entries(groupedOptions).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => {
                        onChange(option.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <span>{option.name}</span>
                      )}
                      {option.id === value && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
