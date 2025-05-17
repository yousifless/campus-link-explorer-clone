
import React from 'react';
import { motion } from 'framer-motion';
import MessagesPage from './MessagesPage';
import { Card, CardContent } from '@/components/ui/card';

export default function Messages() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-6"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-none shadow-lg">
        <CardContent className="p-0">
          <MessagesPage />
        </CardContent>
      </Card>
    </motion.div>
  );
}
