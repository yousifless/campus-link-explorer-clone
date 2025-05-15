import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain } from 'lucide-react';

interface LlmStatusProps {
  status: 'available' | 'unavailable' | 'checking';
}

export function LlmStatus({ status }: LlmStatusProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant={status === 'checking' ? 'outline' : 'default'}
            className="ml-2 flex items-center gap-1"
          >
            <Brain size={14} />
            {status === 'checking' ? 'Loading...' : 'DistilGPT-2'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {status === 'checking' 
            ? 'Loading the DistilGPT-2 icebreaker generator...'
            : 'Using DistilGPT-2 LLM for personalized icebreaker generation'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default LlmStatus; 