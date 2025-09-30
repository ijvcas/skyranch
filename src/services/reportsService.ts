
import { supabase } from '@/integrations/supabase/client';
import { getAllAnimals } from './animalService';
import { getHealthRecords } from './healthRecordService';

export interface Report {
  id: string;
  userId: string;
  name: string;
  reportType: 'animal_summary' | 'breeding_report' | 'health_report' | 'financial_report' | 'custom';
  filters?: any;
  dateRange?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AnimalSummaryData {
  totalAnimals: number;
  bySpecies: Record<string, number>;
  byHealthStatus: Record<string, number>;
  averageAge: number;
  recentBirths: number;
}

export interface HealthReportData {
  totalRecords: number;
  byType: Record<string, number>;
  upcomingVaccinations: number;
  costsSummary: {
    total: number;
    average: number;
    byMonth: Record<string, number>;
  };
}

export const generateAnimalSummaryReport = async (): Promise<AnimalSummaryData> => {
  const allAnimals = await getAllAnimals();
  const animals = allAnimals.filter(animal => animal.lifecycleStatus === 'active');
  
  const bySpecies: Record<string, number> = {};
  const byHealthStatus: Record<string, number> = {};
  let totalAge = 0;
  let animalsWithAge = 0;
  
  const currentDate = new Date();
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  let recentBirths = 0;

  animals.forEach(animal => {
    // Count by species
    bySpecies[animal.species] = (bySpecies[animal.species] || 0) + 1;
    
    // Count by health status
    byHealthStatus[animal.healthStatus] = (byHealthStatus[animal.healthStatus] || 0) + 1;
    
    // Calculate average age
    if (animal.birthDate) {
      const birthDate = new Date(animal.birthDate);
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      totalAge += age;
      animalsWithAge++;
      
      // Count recent births
      if (birthDate >= thirtyDaysAgo) {
        recentBirths++;
      }
    }
  });

  return {
    totalAnimals: animals.length,
    bySpecies,
    byHealthStatus,
    averageAge: animalsWithAge > 0 ? Math.round(totalAge / animalsWithAge) : 0,
    recentBirths
  };
};

export const generateHealthReport = async (): Promise<HealthReportData> => {
  const allAnimals = await getAllAnimals();
  const animals = allAnimals.filter(animal => animal.lifecycleStatus === 'active');
  const allHealthRecords = [];
  
  // Get health records for all animals
  for (const animal of animals) {
    try {
      const records = await getHealthRecords(animal.id);
      allHealthRecords.push(...records);
    } catch (error) {
      console.error(`Error fetching health records for animal ${animal.id}:`, error);
    }
  }

  const byType: Record<string, number> = {};
  let totalCost = 0;
  const costsByMonth: Record<string, number> = {};
  let upcomingVaccinations = 0;

  const currentDate = new Date();
  const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  allHealthRecords.forEach(record => {
    // Count by type
    byType[record.recordType] = (byType[record.recordType] || 0) + 1;
    
    // Calculate costs
    if (record.cost) {
      totalCost += record.cost;
      const monthKey = new Date(record.dateAdministered).toISOString().substring(0, 7);
      costsByMonth[monthKey] = (costsByMonth[monthKey] || 0) + record.cost;
    }
    
    // Count upcoming vaccinations
    if (record.recordType === 'vaccination' && record.nextDueDate) {
      const dueDate = new Date(record.nextDueDate);
      if (dueDate <= thirtyDaysFromNow && dueDate >= currentDate) {
        upcomingVaccinations++;
      }
    }
  });

  return {
    totalRecords: allHealthRecords.length,
    byType,
    upcomingVaccinations,
    costsSummary: {
      total: totalCost,
      average: allHealthRecords.length > 0 ? totalCost / allHealthRecords.length : 0,
      byMonth: costsByMonth
    }
  };
};

export const saveReport = async (report: Omit<Report, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user');
    return false;
  }

  const { error } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      name: report.name,
      report_type: report.reportType,
      filters: report.filters || null,
      date_range: report.dateRange || null
    });

  if (error) {
    console.error('Error saving report:', error);
    return false;
  }

  return true;
};

export const getSavedReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }

  return (data || []).map(report => ({
    id: report.id,
    userId: report.user_id,
    name: report.name,
    reportType: report.report_type as Report['reportType'],
    filters: report.filters,
    dateRange: report.date_range,
    createdAt: report.created_at,
    updatedAt: report.updated_at
  }));
};
