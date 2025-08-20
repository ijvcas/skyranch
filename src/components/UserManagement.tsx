import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getAllUsers, 
  getCurrentUser,
  type AppUser
} from '@/services/userService';
import EditUserDialog from './EditUserDialog';
import UserManagementHeader from './user-management/UserManagementHeader';
import AddUserForm from './user-management/AddUserForm';
import UsersTable from './user-management/UsersTable';
import ExpandableUsersList from './user-management/ExpandableUsersList';
import { useUserManagement } from './user-management/useUserManagement';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const isMobile = useIsMobile();
  
  const {
    showAddForm,
    setShowAddForm,
    newUser,
    setNewUser,
    handleAddUser,
    handleSyncUsers,
    addUserMutation,
    deleteUserMutation,
    deleteUserCompleteMutation,
    toggleStatusMutation,
    syncUsersMutation
  } = useUserManagement();

  // Fetch users from Supabase with aggressive refetching
  const { data: users = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['app-users'],
    queryFn: getAllUsers,
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Force refresh on component mount and when navigating to settings
  useEffect(() => {
    console.log('UserManagement component mounted, forcing refresh...');
    queryClient.invalidateQueries({ queryKey: ['app-users'] });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    refetch();
  }, [refetch, queryClient]);

  // Auto-refresh after user operations
  useEffect(() => {
    if (!addUserMutation.isPending && addUserMutation.isSuccess) {
      setTimeout(() => {
        console.log('Auto-refreshing after user addition...');
        queryClient.invalidateQueries({ queryKey: ['app-users'] });
        refetch();
      }, 1000);
    }
  }, [addUserMutation.isPending, addUserMutation.isSuccess, queryClient, refetch]);

  const handleDeleteUser = (id: string, userName: string) => {
    if (currentUser?.id === id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm(`¿Eliminar a ${userName} de la aplicación?\n\nNota: Este usuario podría reaparecer si existe en el sistema de autenticación.`)) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleCompleteDeleteUser = (id: string, userName: string) => {
    if (currentUser?.id === id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }

    console.log('🗑️ Starting complete deletion for user:', id, userName);
    deleteUserCompleteMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, userName: string) => {
    if (currentUser?.id === id) {
      toast({
        title: "Error",
        description: "No puedes desactivar tu propia cuenta",
        variant: "destructive"
      });
      return;
    }

    toggleStatusMutation.mutate(id);
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    toast({
      title: "Actualizando",
      description: "Actualizando lista de usuarios...",
    });
    queryClient.invalidateQueries({ queryKey: ['app-users'] });
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserManagementHeader
        onToggleAddForm={() => setShowAddForm(!showAddForm)}
      />

      {showAddForm && (
        <AddUserForm
          newUser={newUser}
          onUserChange={setNewUser}
          onSubmit={handleAddUser}
          onCancel={() => setShowAddForm(false)}
          isLoading={addUserMutation.isPending}
        />
      )}

      {isMobile ? (
        <ExpandableUsersList
          users={users}
          currentUser={currentUser}
          onEditUser={setEditingUser}
          onDeleteUser={handleDeleteUser}
          onCompleteDeleteUser={handleCompleteDeleteUser}
          onToggleStatus={handleToggleStatus}
          isToggling={toggleStatusMutation.isPending}
          isDeleting={deleteUserMutation.isPending}
          isCompleteDeleting={deleteUserCompleteMutation.isPending}
        />
      ) : (
        <UsersTable
          users={users}
          currentUser={currentUser}
          onEditUser={setEditingUser}
          onDeleteUser={handleDeleteUser}
          onCompleteDeleteUser={handleCompleteDeleteUser}
          onToggleStatus={handleToggleStatus}
          isToggling={toggleStatusMutation.isPending}
          isDeleting={deleteUserMutation.isPending}
          isCompleteDeleting={deleteUserCompleteMutation.isPending}
        />
      )}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
