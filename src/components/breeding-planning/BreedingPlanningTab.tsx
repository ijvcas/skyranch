
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UniversalPedigreeAnalysisCard from './UniversalPedigreeAnalysisCard';
import BreedingRecommendationsCard from './BreedingRecommendationsCard';
import BreedingAnalyticsCard from './BreedingAnalyticsCard';
import BreedingGoalsCard from './BreedingGoalsCard';
import SeasonalPlanningCard from './SeasonalPlanningCard';

const BreedingPlanningTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="flex flex-col h-auto w-full md:grid md:grid-cols-5 md:h-10">
          <TabsTrigger value="recommendations" className="w-full justify-start md:justify-center">Recomendaciones</TabsTrigger>
          <TabsTrigger value="analysis" className="w-full justify-start md:justify-center">Análisis Individual</TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start md:justify-center">Analíticas</TabsTrigger>
          <TabsTrigger value="goals" className="w-full justify-start md:justify-center">Objetivos</TabsTrigger>
          <TabsTrigger value="seasonal" className="w-full justify-start md:justify-center">Planificación Estacional</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <BreedingRecommendationsCard />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <UniversalPedigreeAnalysisCard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <BreedingAnalyticsCard />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <BreedingGoalsCard />
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <SeasonalPlanningCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BreedingPlanningTab;
