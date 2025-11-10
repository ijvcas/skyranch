
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Palette, Languages } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import UserActivityLogs from './UserActivityLogs';
import FarmCustomization from './FarmCustomization';
import { NotificationTranslationMigration } from './NotificationTranslationMigration';

const SystemSettings = () => {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      {/* Notification Translation Migration */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="notification-migration" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4" />
              <span className="font-semibold">Notification Translation Migration</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <NotificationTranslationMigration />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Farm Customization */}
      <Accordion type="single" collapsible defaultValue="customization" className="w-full">
        <AccordionItem value="customization" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="font-semibold">{t('customization.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <FarmCustomization />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* User Activity Logs */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="user-activity" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="font-semibold">{t('userActivity.title')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <UserActivityLogs />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

};

export default SystemSettings;
