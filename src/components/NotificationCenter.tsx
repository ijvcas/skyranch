
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationFilters } from './notifications/NotificationFilters';
import { NotificationActions } from './notifications/NotificationActions';
import { NotificationTabs } from './notifications/NotificationTabs';

const NotificationCenter = () => {
  const { t } = useTranslation('notifications');
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications,
    snoozeNotification,
    markAsDone
  } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.animalName?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    return matchesSearch && matchesPriority && matchesType;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? t('unreadCount', { count: unreadCount }) : t('allRead')}
          </p>
        </div>
        
        <NotificationActions
          unreadCount={unreadCount}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAllNotifications}
        />
      </div>

      {/* Filters */}
      <NotificationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
      />

      {/* Notifications */}
      <NotificationTabs
        unreadNotifications={unreadNotifications}
        readNotifications={readNotifications}
        filteredNotifications={filteredNotifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        onSnooze={snoozeNotification}
        onMarkAsDone={markAsDone}
      />
    </div>
  );
};

export default NotificationCenter;
