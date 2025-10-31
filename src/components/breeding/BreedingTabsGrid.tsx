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
      "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg transition-all",
      "border hover:border-primary/30",
      isActive 
        ? "btn-gradient text-white border-transparent shadow-md" 
        : "bg-card/50 text-muted-foreground border-border/50 hover:bg-accent/50"
    )}
  >
    <div className="text-xl">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
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
