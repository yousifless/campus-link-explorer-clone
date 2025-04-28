import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface BioFieldsProps {
  value: string;
  onChange: (value: string) => void;
  onPromptSelect?: (prompt: string) => void;
}

export function BioFields({ value, onChange, onPromptSelect }: BioFieldsProps) {
  const prompts = [
    "Tell us about your academic journey and what drives you...",
    "Share your favorite study spots and why you love them...",
    "What are your goals for this semester?",
    "Describe your ideal study group...",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="bio">Bio</Label>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => onPromptSelect?.(prompts[Math.floor(Math.random() * prompts.length)])}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Prompt
        </Button>
      </div>
      <Textarea
        id="bio"
        placeholder="Tell us about yourself..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, index) => (
          <Card
            key={index}
            className="p-2 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onPromptSelect?.(prompt)}
          >
            <p className="text-sm text-muted-foreground">{prompt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
} 