import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Centralized error handling utility
 */
export class ErrorHandler {
  static handle(error: Error | unknown, context: ErrorContext) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Error in ${context.component}.${context.operation}:`, {
      error: errorMessage,
      context,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Show user-friendly error based on error type
    if (errorMessage.includes('timeout')) {
      toast({
        title: "Tiempo de espera agotado",
        description: "La operación tardó demasiado. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive"
      });
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor. Verifica tu conexión a internet.",
        variant: "destructive"
      });
    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para realizar esta acción.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  }

  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }
}