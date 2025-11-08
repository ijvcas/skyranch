
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
}

export const NotificationFilters = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedPriority,
  onPriorityChange
}: NotificationFiltersProps) => {
  const { t } = useTranslation('notifications');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('filters.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('filters.search')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
              <SelectItem value="vaccine">{t('types.vaccine')}</SelectItem>
              <SelectItem value="health">{t('types.health')}</SelectItem>
              <SelectItem value="breeding">{t('types.breeding')}</SelectItem>
              <SelectItem value="weekly_report">{t('types.weekly_report')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPriority} onValueChange={onPriorityChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('filters.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allPriorities')}</SelectItem>
              <SelectItem value="critical">{t('priorities.critical')}</SelectItem>
              <SelectItem value="high">{t('priorities.high')}</SelectItem>
              <SelectItem value="medium">{t('priorities.medium')}</SelectItem>
              <SelectItem value="low">{t('priorities.low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
