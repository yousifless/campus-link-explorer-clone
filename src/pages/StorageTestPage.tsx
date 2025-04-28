import React from 'react';
import { StorageTest } from '@/components/storage/StorageTest';
import MainLayout from '@/components/layout/MainLayout';

const StorageTestPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Storage Diagnostics</h1>
        <p className="mb-6 text-gray-600">
          Use this page to test storage access and diagnose any issues with file uploads.
        </p>
        <StorageTest />
      </div>
    </MainLayout>
  );
};

export default StorageTestPage; 