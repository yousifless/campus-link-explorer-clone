
import React from 'react';
import { Check, Languages, Star } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { Language } from '@/types/database';

type LanguageSelectProps = {
  languages: Language[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const LanguageSelect = ({
  languages,
  value,
  onChange,
  disabled = false
}: LanguageSelectProps) => {
  // Render function for language options
  const renderLanguageOption = (language: Language) => (
    <div className="flex items-center">
      <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{language.name}</span>
      {language.code && (
        <span className="ml-2 text-xs text-muted-foreground">({language.code})</span>
      )}
    </div>
  );

  return (
    <SearchableSelect
      options={languages}
      value={value}
      onChange={onChange}
      placeholder="Select language"
      emptyMessage="No language found"
      disabled={disabled}
      maxHeight="max-h-72"
      renderOption={renderLanguageOption}
    />
  );
};

export default LanguageSelect;
