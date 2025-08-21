
import React, { useState, useEffect } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import VersionControlPanel from '@/components/version-management/VersionControlPanel';
import VersionHistoryPanel from '@/components/version-management/VersionHistoryPanel';
import FarmProfileSettings from './FarmProfileSettings';
import UserActivityLogs from './UserActivityLogs';

const SystemSettings = () => {
  const { user } = useAuth();
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
      {/* User Activity Logs */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sistema</h3>
        {/* User activity under System */}
        {/* We keep sections modular to avoid bloating this file */}
        <UserActivityLogs />
      </div>

      {/* Farm Profile Settings */}
      <FarmProfileSettings />

      {/* Support Info Panel at the top */}
      <SupportInfoSettings isAdmin={isAdmin} />

      {/* Dashboard Banner Settings */}
      <DashboardBannerSettings />

      {/* Timezone Settings */}
      <TimezoneSettings />

      {/* Version Management Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gestión de Versiones</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VersionControlPanel />
          <VersionHistoryPanel />
        </div>
      </div>
    </div>
  );

};

export default SystemSettings;
