import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Heart, Baby } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  weight: number;
  height: number;
  color: string;
  gender: string;
  created_at: string;
  notes: string;
  image_url: string;
  owner_id: string;
}

interface HealthRecord {
  id: string;
  animal_id: string;
  date: string;
  type: string;
  description: string;
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AdvancedAnalytics = () => {
  const { t } = useTranslation('dashboard');
  const { data: animals, isLoading: isLoadingAnimals, error: errorAnimals } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animals')
        .select('*');
      if (error) {
        console.error("Error fetching animals:", error);
        throw error;
      }
      return data;
    },
  });

  const { data: healthRecords, isLoading: isLoadingHealth, error: errorHealth } = useQuery({
    queryKey: ['healthRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_records')
        .select('*');
      if (error) {
        console.error("Error fetching health records:", error);
        throw error;
      }
      return data;
    },
  });

  const getMonthlyRegistrations = () => {
    if (!animals) return [];
    
    const monthCounts = animals.reduce((acc, animal) => {
      const month = new Date(animal.created_at || '').toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    }));
  };

  const getSpeciesDistribution = () => {
    if (!animals) return [];
    
    const speciesCounts = animals.reduce((acc, animal) => {
      acc[animal.species] = (acc[animal.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(speciesCounts).map(([species, count]) => ({
      name: species,
      value: count
    }));
  };

  const getHealthTrends = () => {
    if (!healthRecords) return [];
    
    const monthCounts = healthRecords.reduce((acc, record) => {
      const month = new Date(record.created_at || '').toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    }));
  };

  if (isLoadingAnimals || isLoadingHealth) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('analytics.loading')}</p>
        </div>
      </div>
    );
  }

  if (errorAnimals || errorHealth) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600">{t('analytics.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Animals Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            {t('analytics.totalAnimals')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{animals?.length || 0}</div>
          <p className="text-sm text-gray-500">{t('analytics.animalsInSystem')}</p>
        </CardContent>
      </Card>

      {/* Monthly Registrations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            {t('analytics.monthlyRegistrations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={getMonthlyRegistrations()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Species Distribution Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-gray-500" />
            {t('analytics.speciesDistribution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={getSpeciesDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getSpeciesDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Health Trends Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="w-4 h-4 text-gray-500" />
            {t('analytics.healthTrends')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={getHealthTrends()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
