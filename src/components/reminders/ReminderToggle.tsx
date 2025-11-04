import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

interface ReminderToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label?: string;
  description?: string;
}

const ReminderToggle: React.FC<ReminderToggleProps> = ({
  enabled,
  onToggle,
  label = 'Activar recordatorio',
  description
}) => {
  return (
    <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div>
          <Label htmlFor="reminder-toggle" className="cursor-pointer">
            {label}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Switch
        id="reminder-toggle"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default ReminderToggle;
