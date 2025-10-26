import { useState } from 'react';
import { detectAndSetAllPedigreeDepths } from '@/utils/pedigreeDepthDetector';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for running the pedigree depth detection and update migration
 * This is useful for existing animals that don't have pedigree_max_generation set
 */
export const usePedigreeDepthMigration = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    updated: number;
    errors: number;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const migrationResult = await detectAndSetAllPedigreeDepths();
      setResult(migrationResult);

      if (migrationResult.errors === 0) {
        toast({
          title: 'Migración Completada',
          description: migrationResult.message,
        });
      } else {
        toast({
          title: 'Migración Completada con Errores',
          description: migrationResult.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error en Migración',
        description: errorMessage,
        variant: 'destructive',
      });
      setResult({
        updated: 0,
        errors: 1,
        message: errorMessage
      });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    result,
    runMigration
  };
};
