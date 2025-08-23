
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { addHealthRecord, updateHealthRecord } from '@/services/healthRecordService';
import { getAllAnimals } from '@/services/animalService';
import { useToast } from '@/hooks/use-toast';
import { useHealthRecordNotifications } from '@/hooks/useHealthRecordNotifications';
import BasicInfoSection from '@/components/health-records/BasicInfoSection';
import MedicalDetailsSection from '@/components/health-records/MedicalDetailsSection';
import FormActions from '@/components/health-records/FormActions';

interface HealthRecord {
  id: string;
  animalId: string;
  recordType: string;
  title: string;
  description?: string;
  veterinarian?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  dateAdministered: string;
  nextDueDate?: string;
  notes?: string;
}

interface HealthRecordFormProps {
  record?: HealthRecord;
  onSuccess?: () => void;
  onCancel?: () => void;
  preSelectedAnimalId?: string;
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ 
  record, 
  onSuccess, 
  onCancel,
  preSelectedAnimalId 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setupHealthRecordNotifications } = useHealthRecordNotifications();
  
  const [formData, setFormData] = useState({
    animalId: record?.animalId || preSelectedAnimalId || '',
    recordType: record?.recordType || '',
    title: record?.title || '',
    description: record?.description || '',
    veterinarian: record?.veterinarian || '',
    medication: record?.medication || '',
    dosage: record?.dosage || '',
    cost: record?.cost?.toString() || '',
    dateAdministered: record?.dateAdministered || new Date().toISOString().split('T')[0],
    nextDueDate: record?.nextDueDate || '',
    notes: record?.notes || ''
  });

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: () => getAllAnimals(false)
  });

  const createMutation = useMutation({
    mutationFn: addHealthRecord,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['all-health-records'] });
      
      toast({
        title: "Registro creado",
        description: "El registro de salud ha sido creado exitosamente.",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/health-records');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el registro de salud.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateHealthRecord(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['all-health-records'] });
      
      toast({
        title: "Registro actualizado",
        description: "El registro de salud ha sido actualizado exitosamente.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro de salud.",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.animalId || !formData.recordType || !formData.title) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa animal, tipo de registro y título.",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      animalId: formData.animalId,
      recordType: formData.recordType as any,
      title: formData.title,
      description: formData.description || undefined,
      veterinarian: formData.veterinarian || undefined,
      medication: formData.medication || undefined,
      dosage: formData.dosage || undefined,
      cost: formData.cost ? parseFloat(formData.cost.toString()) : undefined,
      dateAdministered: formData.dateAdministered,
      nextDueDate: formData.nextDueDate || undefined,
      notes: formData.notes || undefined
    };

    if (record) {
      updateMutation.mutate({ id: record.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/health-records');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicInfoSection 
        formData={formData}
        onInputChange={handleInputChange}
      />
      
      <MedicalDetailsSection 
        formData={{
          veterinarian: formData.veterinarian,
          medication: formData.medication,
          dosage: formData.dosage,
          cost: formData.cost,
          nextDueDate: formData.nextDueDate,
          notes: formData.notes
        }}
        onInputChange={handleInputChange}
      />
      
      <FormActions 
        isSubmitting={isLoading}
        onCancel={handleCancel}
      />
    </form>
  );
};

export default HealthRecordForm;
