import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ForecastChartProps {
  data: Array<{
    hour: string;
    value: number;
  }>;
  type: 'precipitation' | 'temperature';
  className?: string;
}

export const ForecastChart = ({ data, type, className = '' }: ForecastChartProps) => {
  const isPrecipitation = type === 'precipitation';
  
  const gradientId = `gradient-${type}`;
  const strokeColor = isPrecipitation ? 'hsl(200, 100%, 60%)' : 'hsl(25, 95%, 53%)';
  const fillColor = isPrecipitation ? 'hsl(200, 100%, 60%)' : 'hsl(25, 95%, 53%)';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-foreground">
            {payload[0].payload.hour}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPrecipitation ? `${payload[0].value}%` : `${payload[0].value}°C`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">
          {isPrecipitation ? 'Precipitation' : 'Temperature'}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isPrecipitation ? 'Next 24 hours' : 'Next 24 hours'}
        </p>
      </div>
      
      <div className="bg-background/20 backdrop-blur-md rounded-2xl p-4 border border-border/20">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.1} />
            
            <XAxis 
              dataKey="hour" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit={isPrecipitation ? '%' : '°'}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              dot={{ 
                fill: strokeColor, 
                r: 4, 
                strokeWidth: 2, 
                stroke: 'hsl(var(--background))' 
              }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
