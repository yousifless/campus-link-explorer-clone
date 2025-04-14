
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Language, Major, University, Campus, Interest } from '@/types/database';
import MajorSelect from './MajorSelect';
import NationalitySelect from './NationalitySelect';
import LanguageSelect from './LanguageSelect';
import UniversityCampusSelect from './UniversitySelect';

export const PersonalInfoFields = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="nickname"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="nickname" className="flex items-center">
              Nickname
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={16} className="ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter a nickname that others will see</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <FormControl>
              <Input 
                id="nickname" 
                placeholder="How would you like to be called?" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="first_name">First Name</FormLabel>
              <FormControl>
                <Input id="first_name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="last_name">Last Name</FormLabel>
              <FormControl>
                <Input id="last_name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

// Bio fields
export const BioFields = ({ form, bioPrompts, handleBioPromptSelect }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Tell us about yourself..." 
                className="min-h-[120px]" 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="cultural_insight"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              Cultural Insights
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle size={16} className="ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share cultural experiences or insights you'd like others to know</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Share cultural experiences or traditions you'd like to discuss..." 
                className="min-h-[80px]" 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

// Academic fields
export const AcademicFields = ({ 
  form, 
  universities, 
  majors, 
  selectedUniversityId, 
  onUniversityChange 
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="university"
        render={({ field }) => (
          <FormItem>
            <FormLabel>University & Campus</FormLabel>
            <FormControl>
              <UniversityCampusSelect
                universities={universities}
                selectedUniversityId={selectedUniversityId}
                selectedCampusId={form.watch('campus') || ''}
                onUniversityChange={(id) => {
                  onUniversityChange(id);
                  form.setValue('campus', '');
                }}
                onCampusChange={(id) => form.setValue('campus', id)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="major"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major</FormLabel>
            <FormControl>
              <MajorSelect
                majors={majors}
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="year_of_study"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Study</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="student_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="international">International Student</SelectItem>
                  <SelectItem value="local">Local Student</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

// Nationality field
export const NationalityField = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="nationality"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nationality</FormLabel>
          <FormControl>
            <NationalitySelect 
              value={field.value} 
              onChange={(value) => form.setValue('nationality', value)} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Language selection component
export const LanguageSelectionComponent = ({ 
  languages, 
  selectedLanguage, 
  setSelectedLanguage, 
  languageProficiency, 
  setLanguageProficiency 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <LanguageSelect
        languages={languages}
        value={selectedLanguage}
        onChange={setSelectedLanguage}
      />
    </div>
  );
};
