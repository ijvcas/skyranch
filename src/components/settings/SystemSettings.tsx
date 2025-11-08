
import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import FarmProfileSettings from './FarmProfileSettings';
import UserActivityLogs from './UserActivityLogs';

const SystemSettings = () => {
  const { user } = useAuth();
  const { t } = useTranslation('settings');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data } = await supabase.rpc('get_current_app_role');
        setIsAdmin(data === 'admin');
      }
    };
    checkAdminRole();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Farm Profile Settings */}
      <FarmProfileSettings />

      {/* Support Info Panel */}
      <SupportInfoSettings isAdmin={isAdmin} />

      {/* Dashboard Banner Settings */}
      <DashboardBannerSettings />

      {/* Timezone Settings */}
      <TimezoneSettings />

      {/* User Activity Logs - Collapsed by default */}
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
