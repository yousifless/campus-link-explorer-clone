import React, { useState } from 'react';
import { toast } from 'sonner';
import { useReferrals } from '@/hooks/useReferrals';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

interface DiscountCodeInputProps {
  onDiscount?: (amount: number) => void;
  className?: string;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({ 
  onDiscount,
  className
}) => {
  const { validateDiscountCode, applyDiscountCode } = useReferrals();
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  
  const handleValidateCode = async () => {
    if (!discountCode.trim()) {
      toast.error('Please enter a discount code');
      return;
    }
    
    setValidationState('validating');
    
    try {
      const amount = await validateDiscountCode(discountCode.trim());
      
      if (amount) {
        setDiscountAmount(amount);
        setValidationState('valid');
        toast.success(`Discount code valid for ${amount}% off!`);
      } else {
        setDiscountAmount(null);
        setValidationState('invalid');
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setValidationState('invalid');
      toast.error('Failed to validate discount code');
    }
  };
  
  const handleApplyCode = async () => {
    if (validationState !== 'valid' || !discountAmount) return;
    
    try {
      const success = await applyDiscountCode(discountCode.trim());
      
      if (success) {
        setAppliedCode(discountCode.trim());
        toast.success(`Applied ${discountAmount}% discount!`);
        
        if (onDiscount) {
          onDiscount(discountAmount);
        }
      }
    } catch (error) {
      console.error('Error applying code:', error);
      toast.error('Failed to apply discount code');
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Ticket className="mr-2 h-5 w-5 text-primary" />
          Discount Code
        </CardTitle>
        <CardDescription>
          Enter a referral discount code to get a discount
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!appliedCode ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  setValidationState('idle');
                }}
                className="font-mono"
                disabled={validationState === 'validating'}
              />
              <Button 
                variant="outline" 
                onClick={handleValidateCode}
                disabled={validationState === 'validating' || !discountCode.trim()}
              >
                {validationState === 'validating' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            
            {validationState === 'valid' && discountAmount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-700">Valid Code!</p>
                  <p className="text-sm text-green-600">
                    You're eligible for a {discountAmount}% discount.
                  </p>
                </div>
              </div>
            )}
            
            {validationState === 'invalid' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Invalid Code</p>
                  <p className="text-sm text-red-600">
                    This code is either invalid, expired, or already used.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700">Discount Applied!</p>
            <p className="text-sm text-green-600 mt-1">
              Your {discountAmount}% discount has been applied with code:
            </p>
            <p className="font-mono font-bold text-green-800 mt-2 p-2 bg-green-100 rounded">
              {appliedCode}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={appliedCode ? 'hidden' : ''}>
        <Button 
          className="w-full" 
          disabled={validationState !== 'valid'} 
          onClick={handleApplyCode}
        >
          Apply Discount
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DiscountCodeInput; 