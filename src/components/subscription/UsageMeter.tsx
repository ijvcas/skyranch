import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, PawPrint } from 'lucide-react';
import { type SubscriptionUsage, TIER_LIMITS, type SubscriptionTier } from '@/services/subscription';

interface UsageMeterProps {
  usage: SubscriptionUsage;
  tier: SubscriptionTier;
}

export default function UsageMeter({ usage, tier }: UsageMeterProps) {
  const limits = TIER_LIMITS[tier];
  
  const animalsPercentage = limits.maxAnimals === Infinity 
    ? 0 
    : (usage.animals_count / limits.maxAnimals) * 100;
    
  const usersPercentage = limits.maxUsers === Infinity 
    ? 0 
    : (usage.users_count / limits.maxUsers) * 100;

  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 90) return '[&>div]:bg-destructive';
    if (percentage >= 70) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso Actual</CardTitle>
        <CardDescription>Límites de tu plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animals Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-muted-foreground" />
              <span>Animales</span>
            </div>
            <span className="font-medium">
              {usage.animals_count} / {limits.maxAnimals === Infinity ? '∞' : limits.maxAnimals}
            </span>
          </div>
          {limits.maxAnimals !== Infinity && (
            <Progress 
              value={animalsPercentage} 
              className={`h-2 ${getProgressColorClass(animalsPercentage)}`}
            />
          )}
        </div>

        {/* Users Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Usuarios</span>
            </div>
            <span className="font-medium">
              {usage.users_count} / {limits.maxUsers === Infinity ? '∞' : limits.maxUsers}
            </span>
          </div>
          {limits.maxUsers !== Infinity && (
            <Progress 
              value={usersPercentage} 
              className={`h-2 ${getProgressColorClass(usersPercentage)}`}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
