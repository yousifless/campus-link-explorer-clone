
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { CoffeeMeetup, MeetupStatus } from '@/types/meetings';

interface MeetupActionsProps {
  meetup: CoffeeMeetup;
  onViewDetails: (meetup: CoffeeMeetup) => void;
  onEdit: (meetup: CoffeeMeetup) => void;
  onConfirm: (meetup: CoffeeMeetup) => void;
  onCancel: (meetup: CoffeeMeetup) => void;
}

const MeetupActions: React.FC<MeetupActionsProps> = ({
  meetup,
  onViewDetails,
  onEdit,
  onConfirm,
  onCancel
}) => {

  const handleViewDetails = (meetup: CoffeeMeetup) => {
    onViewDetails({
      ...meetup,
      status: meetup.status as MeetupStatus
    });
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" onClick={() => handleViewDetails(meetup)}>
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onEdit(meetup)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onConfirm(meetup)}>
        <CheckCircle className="h-4 w-4 mr-2" />
        Confirm
      </Button>
      <Button variant="destructive" size="sm" onClick={() => onCancel(meetup)}>
        <XCircle className="h-4 w-4 mr-2" />
        Cancel
      </Button>
    </div>
  );
};

export default MeetupActions;
