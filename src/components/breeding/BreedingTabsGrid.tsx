import React from 'react';
import { cn } from '@/lib/utils';

interface TabTriggerProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabTrigger: React.FC<TabTriggerProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-all",
      "border-2 hover:border-primary/50",
      isActive 
        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
        : "bg-card text-muted-foreground border-border hover:bg-accent"
    )}
  >
    <div className="text-2xl">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

interface BreedingTabsGridProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const BreedingTabsGrid: React.FC<BreedingTabsGridProps> = ({
  value,
  onValueChange,
  children
}) => {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};

interface TabsListGridProps {
  children: React.ReactNode;
}

export const TabsListGrid: React.FC<TabsListGridProps> = ({ children }) => (
  <div className="grid grid-cols-2 gap-3">
    {children}
  </div>
);

export { TabTrigger };
