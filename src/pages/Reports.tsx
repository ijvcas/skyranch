
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageLayout from '@/components/ui/page-layout';
import ReportsDashboard from '@/components/ReportsDashboard';
import FieldReportsLog from '@/components/field-reports/FieldReportsLog';

const Reports: React.FC = () => {
  const { t } = useTranslation('reports');
  
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="flex flex-col w-full md:grid md:grid-cols-2">
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('tabs.finance')}
            </TabsTrigger>
            <TabsTrigger value="field-reports" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {t('tabs.fieldReports')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="mt-6">
            <ReportsDashboard />
          </TabsContent>
          
          <TabsContent value="field-reports" className="mt-6">
            <FieldReportsLog />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Reports;
