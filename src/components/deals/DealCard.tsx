
import React from 'react';
import { DealType } from '@/types/database';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BadgePercent, MapPin, Star, Clock, QrCode } from 'lucide-react';
import { format } from 'date-fns';

interface DealCardProps {
  deal: DealType;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const formattedExpirationDate = format(new Date(deal.expiration_date), 'MMMM d, yyyy');
  
  return (
    <Card className="overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="relative h-48 overflow-hidden">
        {deal.image_url ? (
          <img 
            src={deal.image_url} 
            alt={deal.business_name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BadgePercent className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {deal.is_exclusive && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
            Exclusive
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{deal.business_name}</CardTitle>
          <Badge variant="outline" className="font-bold text-primary">
            {deal.discount_percentage}% OFF
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-xs mt-1">
          <MapPin className="h-3.5 w-3.5" />
          {deal.location}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm line-clamp-2">{deal.description}</p>
        
        <div className="flex items-center mt-3 gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Expires: {formattedExpirationDate}</p>
        </div>
        
        <div className="flex items-center mt-1 text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium ml-1">{deal.average_rating}</span>
          <span className="text-xs text-muted-foreground ml-1">({deal.review_count} reviews)</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">View Deal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{deal.business_name} - {deal.discount_percentage}% Discount</DialogTitle>
              <DialogDescription>
                Show this code to the cashier to redeem your discount.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <div className="bg-muted rounded-lg p-4 mb-4 w-full flex justify-center">
                <QrCode className="h-40 w-40" />
              </div>
              <div className="font-mono text-xl font-bold tracking-widest bg-muted px-4 py-2 rounded-md">
                {deal.redemption_code}
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Valid until {formattedExpirationDate}. This offer cannot be combined with other promotions.
              </p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="sm:flex-1">Share Deal</Button>
              <Button className="sm:flex-1">Save to Favorites</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DealCard;
