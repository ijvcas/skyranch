
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnimalListFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSpecies: string;
  onSpeciesChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
}

const AnimalListFilters = ({
  searchTerm,
  onSearchChange,
  selectedSpecies,
  onSpeciesChange,
  selectedStatus,
  onStatusChange
}: AnimalListFiltersProps) => {
  const { t } = useTranslation(['animals', 'common']);

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('common:search.byNameOrTag')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
              <Select value={selectedSpecies} onValueChange={onSpeciesChange}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={t('animals:filters.species')} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">{t('animals:filters.allSpecies')}</SelectItem>
                  <SelectItem value="bovino">{t('animals:species.bovino')}</SelectItem>
                  <SelectItem value="ovino">{t('animals:species.ovino')}</SelectItem>
                  <SelectItem value="caprino">{t('animals:species.caprino')}</SelectItem>
                  <SelectItem value="porcino">{t('animals:species.porcino')}</SelectItem>
                  <SelectItem value="equino">{t('animals:species.equino')}</SelectItem>
                  <SelectItem value="aviar">{t('animals:species.aviar')}</SelectItem>
                  <SelectItem value="caninos">{t('animals:species.canino')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder={t('animals:filters.status')} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">{t('animals:filters.allStatuses')}</SelectItem>
                  <SelectItem value="healthy">{t('animals:status.healthy')}</SelectItem>
                  <SelectItem value="sick">{t('animals:status.sick')}</SelectItem>
                  <SelectItem value="pregnant">{t('animals:status.pregnant')}</SelectItem>
                  <SelectItem value="pregnant-healthy">{t('animals:status.pregnantHealthy')}</SelectItem>
                  <SelectItem value="pregnant-sick">{t('animals:status.pregnantSick')}</SelectItem>
                  <SelectItem value="treatment">{t('animals:status.treatment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimalListFilters;
