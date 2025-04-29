
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScheduleMeetupButtonProps {
  onClick: () => void;
}

const ScheduleMeetupButton: React.FC<ScheduleMeetupButtonProps> = ({ onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Button
        onClick={onClick}
        className="rounded-full h-14 w-14 p-0 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-900"
        aria-label="Schedule new meetup"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <Coffee className="h-6 w-6 text-white" />
        </motion.div>
      </Button>
      <motion.div 
        className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full h-6 w-6 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </motion.div>
    </motion.div>
  );
};

export default ScheduleMeetupButton;
