
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Coffee, Utensils, Book, Tag, Store } from 'lucide-react';

interface DealFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const DealFilters: React.FC<DealFiltersProps> = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'cafe', name: 'Cafés', icon: Coffee },
    { id: 'restaurant', name: 'Restaurants', icon: Utensils },
    { id: 'bookstore', name: 'Bookstores', icon: Book },
    { id: 'other', name: 'Other', icon: Store }
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search deals..." 
          className="pl-9 w-full md:max-w-sm"
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="rounded-full"
        >
          <Tag className="mr-2 h-4 w-4" />
          All Deals
        </Button>
        
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.id)}
            className="rounded-full"
          >
            <category.icon className="mr-2 h-4 w-4" />
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DealFilters;
