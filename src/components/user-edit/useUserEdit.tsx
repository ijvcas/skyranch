
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser, type AppUser } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseUserEditProps {
  user: AppUser;
  onClose: () => void;
}

export const useUserEdit = ({ user, onClose }: UseUserEditProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    is_active: user.is_active,
    notificationPreferences: {
      email: true,
      push: true,
      inApp: true
    }
  });

  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      notificationPreferences: {
        email: true,
        push: true,
        inApp: true
      }
    });
    setPhoneError('');
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AppUser>) => updateUser(user.id, data),
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario se han actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario.",
        variant: "destructive",
      });
    },
  });

  // Role change mutation - calls edge function for secure role updates
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { data, error } = await supabase.functions.invoke('change-user-role', {
        body: {
          targetUserId: userId,
          newRole: newRole
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-users'] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido actualizado exitosamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el rol',
        variant: 'destructive'
      });
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear phone error when user starts typing
    if (field === 'phone') {
      setPhoneError('');
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    
    // Basic phone validation - adjust regex as needed
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Formato de teléfono inválido');
      return;
    }
    
    // Check if user is admin
    const { data: currentUserRole } = await supabase.rpc('get_current_app_role');
    const isCurrentUserAdmin = currentUserRole === 'admin';
    const isAdminUser = user.role === 'admin';
    
    // If role changed and current user is admin, use edge function
    if (isCurrentUserAdmin && formData.role !== user.role) {
      changeRoleMutation.mutate({
        userId: user.id,
        newRole: formData.role
      });
    }
    
    // Update basic info (not role - that's handled separately)
    const updateData: Partial<AppUser> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      is_active: formData.is_active
    };

    console.log('📝 Updating user with data:', updateData);
    updateMutation.mutate(updateData);
  };

  const isAdminUser = user.role === 'admin';

  return {
    formData,
    phoneError,
    setPhoneError,
    handleInputChange,
    handleSubmit,
    updateMutation,
    changeRoleMutation,
    isAdminUser
  };
};
