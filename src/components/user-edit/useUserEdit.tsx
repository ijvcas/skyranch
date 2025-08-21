
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser, type AppUser } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (formData.phone && !validatePhone(formData.phone)) {
      setPhoneError('Formato de teléfono inválido');
      return;
    }
    
    // Prevent editing admin users' roles
    const isAdminUser = user.email === 'juan.casanova@skyranch.com' || user.email === 'jvcas@mac.com';
    
    // Include phone in update data
    const updateData: Partial<AppUser> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: isAdminUser ? user.role : formData.role,
      is_active: formData.is_active
    };

    console.log('📝 Updating user with data:', updateData);
    updateMutation.mutate(updateData);
  };

  const isAdminUser = user.email === 'juan.casanova@skyranch.com' || user.email === 'jvcas@mac.com';

  return {
    formData,
    phoneError,
    setPhoneError,
    handleInputChange,
    handleSubmit,
    updateMutation,
    isAdminUser
  };
};
