import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmProfileService, type FarmProfile, type FarmProfileFormData } from '@/services/farmProfileService';
import { useState } from 'react';

export const FARM_PROFILE_KEY = ['farm-profile'];

export interface UploadProgress {
  stage: 'compression' | 'upload';
  progress: number;
  statusText: string;
}

export const useFarmProfileWithProgress = () => {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const query = useQuery<FarmProfile | null>({
    queryKey: FARM_PROFILE_KEY,
    queryFn: () => farmProfileService.getFarmProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: FarmProfileFormData) => farmProfileService.createFarmProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FarmProfileFormData> }) =>
      farmProfileService.updateFarmProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File | string }) => {
      setUploadProgress({ stage: 'upload', progress: 0, statusText: 'Iniciando...' });
      
      const url = await farmProfileService.uploadLogo(file, (progress) => {
        setUploadProgress({ 
          stage: 'upload', 
          progress, 
          statusText: progress < 100 ? 'Subiendo logo...' : 'Finalizando...' 
        });
      });
      
      await farmProfileService.updateLogo(id, url);
      setUploadProgress(null);
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
    },
    onError: () => {
      setUploadProgress(null);
    },
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File | string }) => {
      setUploadProgress({ stage: 'upload', progress: 0, statusText: 'Iniciando...' });
      
      const url = await farmProfileService.uploadPicture(file, (progress) => {
        setUploadProgress({ 
          stage: 'upload', 
          progress, 
          statusText: progress < 100 ? 'Subiendo imagen...' : 'Finalizando...' 
        });
      });
      
      await farmProfileService.updatePicture(id, url);
      setUploadProgress(null);
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
    },
    onError: () => {
      setUploadProgress(null);
    },
  });

  return {
    ...query,
    createFarmProfile: createMutation.mutateAsync,
    updateFarmProfile: updateMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    uploadPicture: uploadPictureMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploadingLogo: uploadLogoMutation.isPending,
    isUploadingPicture: uploadPictureMutation.isPending,
    uploadProgress,
  };
};
