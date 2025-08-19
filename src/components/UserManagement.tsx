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

  // Optimized user queries with proper timeout and reasonable refetch
  const { data: users = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['app-users'],
    queryFn: getAllUsers,
    staleTime: 30000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid spam
    refetchOnMount: 'always',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 60000, // Current user changes less frequently
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando usuarios...</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Recargar ahora
          </button>
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
