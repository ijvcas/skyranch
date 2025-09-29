import React from 'react';
import PageLayout from '@/components/ui/page-layout';
import SalesHistoryView from '@/components/animal-sale/SalesHistoryView';

const SalesHistory: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <SalesHistoryView />
      </div>
    </PageLayout>
  );
};

export default SalesHistory;