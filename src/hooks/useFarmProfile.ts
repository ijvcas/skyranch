import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmProfileService, type FarmProfile, type FarmProfileFormData } from '@/services/farmProfileService';

export const FARM_PROFILE_KEY = ['farm-profile'];

export const useFarmProfile = () => {
  const queryClient = useQueryClient();

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
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      farmProfileService.uploadLogo(file).then(url => 
        farmProfileService.updateLogo(id, url)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
    },
  });

  const uploadPictureMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      farmProfileService.uploadPicture(file).then(url => 
        farmProfileService.updatePicture(id, url)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FARM_PROFILE_KEY });
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
  };
};