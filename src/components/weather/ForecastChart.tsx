import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";

interface ChartDataPoint {
  time: string;
  value: number;
}

interface ForecastChartProps {
  data: ChartDataPoint[];
  type: "precipitation" | "temperature";
  className?: string;
}

const CustomTooltip = ({ active, payload, type }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="weather-tooltip">
        <p className="weather-tooltip-text">
          {type === "temperature" 
            ? `${Math.round(payload[0].value)}°C`
            : `${payload[0].value}%`
          }
        </p>
      </div>
    );
  }
  return null;
};

export default function ForecastChart({ data, type, className }: ForecastChartProps) {
  const title = type === "precipitation" ? "Precipitación (24 h)" : "Temperatura (24 h)";

  return (
    <div className={className}>
      <h3 className="weather-section-title">{title}</h3>
      <div className="weather-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          {type === "temperature" ? (
            <LineChart data={data}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#FFD700"
                strokeWidth={3}
                dot={{ fill: '#FFD700', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrecip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#87CEEB"
                strokeWidth={3}
                fill="url(#colorPrecip)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
