
import React from 'react';
import { Building } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { University, Campus } from '@/types/database';

type UniversitySelectProps = {
  universities: University[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type CampusSelectProps = {
  campuses: Campus[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const UniversitySelect = ({
  universities,
  value,
  onChange,
  disabled = false
}: UniversitySelectProps) => {
  // Group universities by country
  const universityOptions = universities.map(uni => ({
    ...uni,
    category: uni.country
  }));
  
  const renderUniversityOption = (university: University) => (
    <div className="flex items-center">
      <Building className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{university.name}</span>
      {university.type && (
        <span className="ml-2 text-xs text-muted-foreground">({university.type})</span>
      )}
    </div>
  );

  return (
    <SearchableSelect
      options={universityOptions}
      value={value}
      onChange={onChange}
      placeholder="Select university"
      emptyMessage="No university found"
      disabled={disabled}
      groupBy="category"
      maxHeight="max-h-72"
      renderOption={renderUniversityOption}
    />
  );
};

export const CampusSelect = ({
  campuses,
  value,
  onChange,
  disabled = false
}: CampusSelectProps) => {
  const renderCampusOption = (campus: Campus) => (
    <div className="flex items-center">
      <Building className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{campus.name}</span>
    </div>
  );

  return (
    <SearchableSelect
      options={campuses}
      value={value}
      onChange={onChange}
      placeholder="Select campus"
      emptyMessage="No campus found"
      disabled={disabled}
      maxHeight="max-h-72"
      renderOption={renderCampusOption}
    />
  );
};

export default UniversitySelect;
