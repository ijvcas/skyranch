import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { type GlobalOwnershipAnalysis } from '@/services/ownerAnalysisService';
import { Users, Building2, TrendingUp, PieChart } from 'lucide-react';

interface OwnershipSummaryStatsProps {
  analysis: GlobalOwnershipAnalysis;
}

const OwnershipSummaryStats: React.FC<OwnershipSummaryStatsProps> = ({ analysis }) => {
  const multiParcelPercentage = analysis.totalOwners > 0
    ? Math.round((analysis.multiParcelOwners / analysis.totalOwners) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Propietarios',
      value: analysis.totalOwners,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Grupos de Propiedad',
      value: analysis.uniqueOwnerGroups,
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Multi-Parcela',
      value: analysis.multiParcelOwners,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      label: 'Concentración',
      value: `${multiParcelPercentage}%`,
      icon: PieChart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OwnershipSummaryStats;
