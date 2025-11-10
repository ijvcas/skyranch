import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <div className="text-muted-foreground mt-1 text-sm sm:text-base">{subtitle}</div>}
      </div>
      {children && <div className="flex gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}