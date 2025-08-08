
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SupportInfoSettings from './SupportInfoSettings';
import DashboardBannerSettings from './DashboardBannerSettings';
import TimezoneSettings from '@/components/TimezoneSettings';
import VersionControlPanel from '@/components/version-management/VersionControlPanel';
import VersionHistoryPanel from '@/components/version-management/VersionHistoryPanel';
import FarmProfileSettings from './FarmProfileSettings';

const SystemSettings = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'jvcas@mac.com';

  return (
    <div className="space-y-6">
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
