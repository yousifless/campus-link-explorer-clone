
import React from 'react';
import { BookOpen } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { Major } from '@/types/database';

type MajorSelectProps = {
  majors: Major[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const MajorSelect = ({
  majors,
  value,
  onChange,
  disabled = false
}: MajorSelectProps) => {
  // Prepare majors with categories for grouping
  const majorOptions = majors.map(major => ({
    ...major,
    category: major.field_of_study
  }));

  // Render function for major options
  const renderMajorOption = (major: Major) => (
    <div className="flex items-center">
      <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{major.name}</span>
      {major.field_of_study && (
        <span className="ml-2 text-xs text-muted-foreground">({major.field_of_study})</span>
      )}
    </div>
  );

  return (
    <SearchableSelect
      options={majorOptions}
      value={value}
      onChange={onChange}
      placeholder="Select major"
      emptyMessage="No major found"
      disabled={disabled}
      groupBy="category"
      maxHeight="max-h-72"
      renderOption={renderMajorOption}
    />
  );
};

export default MajorSelect;
