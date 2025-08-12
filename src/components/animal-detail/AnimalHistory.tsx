import React from 'react';
import type { Animal } from '@/stores/animalStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimezone } from '@/hooks/useTimezone';

interface AnimalHistoryProps {
  animal: Animal;
}

const AnimalHistory: React.FC<AnimalHistoryProps> = ({ animal }) => {
  const { formatDateInput } = useTimezone();

  const items: { label: string; value: string }[] = [];

  if (animal.birthDate) {
    items.push({ label: 'Nacimiento', value: formatDateInput(animal.birthDate) });
  }
  if (animal.lifecycleStatus === 'deceased') {
    items.push({ label: 'Fallecimiento', value: animal.dateOfDeath ? formatDateInput(animal.dateOfDeath) : 'No registrado' });
    if (animal.causeOfDeath) {
      items.push({ label: 'Causa de fallecimiento', value: animal.causeOfDeath });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial del Animal</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin eventos registrados aún.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start justify-between border-b pb-2 last:border-b-0">
                <span className="font-medium">{item.label}</span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimalHistory;
