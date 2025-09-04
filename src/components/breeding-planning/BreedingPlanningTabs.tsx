
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BreedingAnalyticsCard from './BreedingAnalyticsCard';
import BreedingRecommendationsCard from './BreedingRecommendationsCard';
import OptimizedBreedingRecommendationsList from './OptimizedBreedingRecommendationsList';
import BreedingGoalsCard from './BreedingGoalsCard';
import SeasonalPlanningCard from './SeasonalPlanningCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const BreedingPlanningTabs = () => {
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="analytics" className="space-y-4 md:space-y-6">
      <TabsList className={cn(
        "grid w-full",
        isMobile ? "grid-cols-2 gap-1" : "grid-cols-4"
      )}>
        <TabsTrigger 
          value="analytics" 
          className={cn(
            "text-xs md:text-sm",
            isMobile && "px-2 py-1"
          )}
        >
          {isMobile ? "Real" : "Análisis Real"}
        </TabsTrigger>
        <TabsTrigger 
          value="recommendations" 
          className={cn(
            "text-xs md:text-sm",
            isMobile && "px-2 py-1"
          )}
        >
          {isMobile ? "Genético" : "Análisis Genético"}
        </TabsTrigger>
        {!isMobile && (
          <>
            <TabsTrigger value="goals" className="text-sm">
              Objetivos
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="text-sm">
              Planificación Estacional
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="analytics" className="space-y-4 md:space-y-6">
        <BreedingAnalyticsCard />
      </TabsContent>

      <TabsContent value="recommendations" className="space-y-4 md:space-y-6">
        <OptimizedBreedingRecommendationsList />
      </TabsContent>

      {!isMobile && (
        <>
          <TabsContent value="goals" className="space-y-6">
            <BreedingGoalsCard />
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-6">
            <SeasonalPlanningCard />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
};

export default BreedingPlanningTabs;
