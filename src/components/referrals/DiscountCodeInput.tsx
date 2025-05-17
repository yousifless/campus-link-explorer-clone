
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useReferrals } from '@/hooks/useReferrals';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DiscountCodeInputProps {
  onCodeGenerated: (code: string) => void;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({ onCodeGenerated }) => {
  const [discountCode, setDiscountCode] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateDiscountCode = async () => {
    setGenerating(true);
    // Generate a random code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setDiscountCode(code);
    onCodeGenerated(code);
    toast.success('Discount code generated!');
    setGenerating(false);
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Generated Code"
        value={discountCode}
        readOnly
        className="font-mono"
      />
      <Button onClick={generateDiscountCode} disabled={generating}>
        {generating ? 'Generating...' : 'Generate Code'}
      </Button>
    </div>
  );
};

export default DiscountCodeInput;
