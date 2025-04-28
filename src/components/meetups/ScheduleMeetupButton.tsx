import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScheduleMeetupButtonProps {
  onClick: () => void;
}

const ScheduleMeetupButton: React.FC<ScheduleMeetupButtonProps> = ({ onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={onClick}
        className="rounded-full h-12 w-12 p-0"
        aria-label="Schedule new meetup"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </motion.div>
  );
};

export default ScheduleMeetupButton; 