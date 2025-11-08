
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchFilters {
  name: string;
  tag: string;
  species: string;
  breed: string;
  healthStatus: string;
  ageMin: string;
  ageMax: string;
  weightMin: string;
  weightMax: string;
  gender: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSearch, onClear }) => {
  const { t } = useTranslation(['animals', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    tag: '',
    species: '',
    breed: '',
    healthStatus: '',
    ageMin: '',
    ageMax: '',
    weightMin: '',
    weightMax: '',
    gender: ''
  });

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      name: '',
      tag: '',
      species: '',
      breed: '',
      healthStatus: '',
      ageMin: '',
      ageMax: '',
      weightMin: '',
      weightMax: '',
      gender: ''
    });
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>{t('animals:search.advancedSearch')}</span>
                {hasActiveFilters && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {t('animals:search.activeFilters')}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-name">{t('animals:form.name')}</Label>
                <Input
                  id="search-name"
                  placeholder={t('common:search.byName')}
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-tag">{t('animals:search.idTag')}</Label>
                <Input
                  id="search-tag"
                  placeholder={t('common:search.byId')}
                  value={filters.tag}
                  onChange={(e) => handleFilterChange('tag', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('animals:form.species')}</Label>
                <Select value={filters.species} onValueChange={(value) => handleFilterChange('species', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('animals:search.selectSpecies')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ovino">{t('animals:species.ovino')}</SelectItem>
                    <SelectItem value="bovino">{t('animals:species.bovino')}</SelectItem>
                    <SelectItem value="equino">{t('animals:species.equino')}</SelectItem>
                    <SelectItem value="porcino">{t('animals:species.porcino')}</SelectItem>
                    <SelectItem value="caprino">{t('animals:species.caprino')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-breed">{t('animals:form.breed')}</Label>
                <Input
                  id="search-breed"
                  placeholder={t('common:search.byBreed')}
                  value={filters.breed}
                  onChange={(e) => handleFilterChange('breed', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('animals:search.healthStatus')}</Label>
                <Select value={filters.healthStatus} onValueChange={(value) => handleFilterChange('healthStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('animals:search.healthStatusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">{t('animals:status.healthy')}</SelectItem>
                    <SelectItem value="sick">{t('animals:status.sick')}</SelectItem>
                    <SelectItem value="pregnant">{t('animals:status.pregnant')}</SelectItem>
                    <SelectItem value="treatment">{t('animals:status.treatment')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('animals:form.gender')}</Label>
                <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('animals:search.selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('animals:gender.male')}</SelectItem>
                    <SelectItem value="female">{t('animals:gender.female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('animals:search.ageYears')}</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder={t('animals:search.min')}
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder={t('animals:search.max')}
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('animals:search.weightKg')}</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder={t('animals:search.min')}
                    value={filters.weightMin}
                    onChange={(e) => handleFilterChange('weightMin', e.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder={t('animals:search.max')}
                    value={filters.weightMax}
                    onChange={(e) => handleFilterChange('weightMax', e.target.value)}
                    type="number"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
                <Search className="w-4 h-4 mr-2" />
                {t('common:actions.search')}
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                {t('animals:search.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedSearch;
