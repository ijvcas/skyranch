
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addUser, deleteUser, deleteUserComplete, toggleUserStatus, syncAuthUsersToAppUsers, type AppUser, type CompleteUserDeletionResult } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

export const useUserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker' as AppUser['role'],
    is_active: true,
    notificationPreferences: {
      email: true,
      push: true,
      inApp: true
    }
  });

  // Mutations for user operations
  const addUserMutation = useMutation({
    mutationFn: addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      const userName = newUser.name;
      setNewUser({ 
        name: '', 
        email: '', 
        phone: '', 
        role: 'worker', 
        is_active: true,
        notificationPreferences: {
          email: true,
          push: true,
          inApp: true
        }
      });
      setShowAddForm(false);
      toast({
        title: "Usuario Agregado",
        description: `${userName} ha sido agregado exitosamente`,
      });
    },
    onError: (error: any) => {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el usuario",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: "Usuario Eliminado",
        description: "El usuario ha sido eliminado de la aplicación.",
        duration: 5000
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting user:', error);
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
        duration: 8000
      });
    }
  });

  // New complete deletion mutation
  const deleteUserCompleteMutation = useMutation({
    mutationFn: deleteUserComplete,
    onSuccess: (result: CompleteUserDeletionResult) => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      
      if (result.warning) {
        toast({
          title: "Usuario Eliminado con Advertencia",
          description: result.warning,
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Usuario Completamente Eliminado",
          description: "El usuario ha sido eliminado completamente del sistema y no reaparecerá.",
          duration: 5000
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error in complete user deletion:', error);
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: "Error en Eliminación Completa",
        description: error.message || "No se pudo eliminar el usuario completamente",
        variant: "destructive",
        duration: 8000
      });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: "Estado Actualizado",
        description: `${updatedUser.name} ${updatedUser.is_active ? 'activado' : 'desactivado'}`,
      });
    },
    onError: (error) => {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive"
      });
    }
  });

  const syncUsersMutation = useMutation({
    mutationFn: syncAuthUsersToAppUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: "Usuarios Sincronizados",
        description: "Los usuarios de autenticación se han sincronizado correctamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error syncing users:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo sincronizar los usuarios",
        variant: "destructive"
      });
    }
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive"
      });
      return;
    }

    console.log('📝 Adding user with data:', newUser);
    addUserMutation.mutate(newUser);
  };

  const handleSyncUsers = () => {
    console.log('🔄 Manual sync triggered');
    syncUsersMutation.mutate();
  };

  return {
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
  };
};
