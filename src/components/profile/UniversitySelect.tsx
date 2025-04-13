
import React, { useState, useEffect } from 'react';
import { School, MapPin } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { University, Campus } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

type UniversityCampusSelectProps = {
  universities: University[];
  selectedUniversityId: string;
  selectedCampusId: string;
  onUniversityChange: (id: string) => void;
  onCampusChange: (id: string) => void;
  universityDisabled?: boolean;
  campusDisabled?: boolean;
};

const UniversityCampusSelect = ({
  universities,
  selectedUniversityId,
  selectedCampusId,
  onUniversityChange,
  onCampusChange,
  universityDisabled = false,
  campusDisabled = false
}: UniversityCampusSelectProps) => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch campuses when university is selected
  useEffect(() => {
    if (!selectedUniversityId) {
      setCampuses([]);
      return;
    }

    const fetchCampuses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('campuses')
          .select('*')
          .eq('university_id', selectedUniversityId)
          .order('name');
        
        if (error) throw error;
        setCampuses(data || []);
      } catch (error) {
        console.error('Error fetching campuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, [selectedUniversityId]);

  // Render function for university options
  const renderUniversityOption = (university: University) => (
    <div className="flex items-center">
      <School className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{university.name}</span>
      {university.location && (
        <span className="ml-2 text-xs text-muted-foreground">({university.location})</span>
      )}
    </div>
  );

  // Render function for campus options
  const renderCampusOption = (campus: Campus) => (
    <div className="flex items-center">
      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
      <span>{campus.name}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <SearchableSelect
        options={universities}
        value={selectedUniversityId}
        onChange={onUniversityChange}
        placeholder="Select university"
        emptyMessage="No university found"
        disabled={universityDisabled}
        maxHeight="max-h-72"
        renderOption={renderUniversityOption}
      />
      
      <SearchableSelect
        options={campuses}
        value={selectedCampusId}
        onChange={onCampusChange}
        placeholder="Select campus"
        emptyMessage={selectedUniversityId ? "No campuses found" : "Select a university first"}
        disabled={campusDisabled || loading || !selectedUniversityId}
        maxHeight="max-h-60"
        renderOption={renderCampusOption}
      />
    </div>
  );
};

export default UniversityCampusSelect;
