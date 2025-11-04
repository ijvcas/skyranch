
import React from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import AnimalEditStates from '@/components/animal-edit/AnimalEditStates';
import AnimalEditFormContainer from '@/components/animal-edit/AnimalEditFormContainer';
import { useAnimalEditLogic } from '@/hooks/animal-edit/useAnimalEditLogic';

const AnimalEdit = () => {
  const {
    id,
    animal,
    isLoading,
    error,
    formData,
    permissionError,
    updateMutation,
    handleInputChange,
    handleImageChange,
    handleLocationChange,
    handleSubmit,
    navigate
  } = useAnimalEditLogic();

  const handleCancel = () => navigate(`/animals/${id}`);
  const handleNavigateBack = () => navigate('/animals');

  // Check for special states first
  if (isLoading) {
    return (
      <div className="page-with-logo">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Cargando animal...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <AnimalEditStates
        isLoading={false}
        error={error}
        animal={animal}
        permissionError={permissionError}
        onNavigateBack={handleNavigateBack}
      />
    );
  }

  if (permissionError) {
    return (
      <AnimalEditStates
        isLoading={false}
        error={null}
        animal={animal}
        permissionError={permissionError}
        onNavigateBack={handleNavigateBack}
      />
    );
  }

  // Show the normal edit form when everything is okay
  return (
    <PermissionGuard permission="animals_edit">
      <AnimalEditFormContainer
        animal={animal}
        formData={formData}
        updateMutation={updateMutation}
        onInputChange={handleInputChange}
        onImageChange={handleImageChange}
        onLocationChange={handleLocationChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </PermissionGuard>
  );
};

export default AnimalEdit;
