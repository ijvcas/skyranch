import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  metadata: any;
  created_at: string;
}

export const useAIChat = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  const sendMessage = async (message: string, file?: File) => {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setIsLoading(true);
      console.log('📤 Sending message:', message.substring(0, 50) + '...');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user');
        throw new Error('No authenticated user');
      }
      console.log('✅ User authenticated:', user.id);

      // Save user message to history
      console.log('💾 Saving user message to chat_history...');
      const { data: userMessage, error: saveError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message,
          role: 'user',
          metadata: {},
        }])
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving user message:', saveError);
        toast({
          title: 'Error guardando mensaje',
          description: saveError.message,
          variant: 'destructive',
        });
        throw saveError;
      }
      console.log('✅ User message saved:', userMessage.id);

      // ✅ PHASE 2: Optimistic UI - Show user message immediately
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });

      // Set 60-second timeout for AI response
      timeoutId = setTimeout(() => {
        console.warn('⏱️ Request timeout after 60 seconds');
        abortController.abort();
      }, 60000);

      // Call AI edge function with timeout
      console.log('🚀 Calling AI chat function...');
      
      let aiResponse, aiError;
      
      if (file) {
        // If file is provided, use multipart/form-data
        const formData = new FormData();
        formData.append('message', message);
        formData.append('file', file);
        formData.append('fileType', file.type);

        const response = await supabase.functions.invoke('ai-chat', {
          body: formData,
        });
        
        aiResponse = response.data;
        aiError = response.error;
      } else {
        // Regular JSON request
        const response = await supabase.functions.invoke('ai-chat', {
          body: { message },
        });
        
        aiResponse = response.data;
        aiError = response.error;
      }

      // Clear timeout on successful response
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log('AI Response:', aiResponse);
      console.log('AI Error:', aiError);

      if (aiError) {
        console.error('Edge function error:', aiError);
        // Try to get the actual error message from the response
        const errorMessage = aiResponse?.error || aiError.message || 'Error al llamar al servicio de IA';
        throw new Error(errorMessage);
      }

      if (aiResponse?.error) {
        console.error('❌ AI returned error:', aiResponse.error);
        throw new Error(aiResponse.error);
      }

      // Save assistant response to history
      console.log('💾 Saving assistant response to chat_history...');
      const { error: assistantError } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          message: aiResponse.response,
          role: 'assistant',
          metadata: aiResponse.metadata || {},
        }]);

      if (assistantError) {
        console.error('❌ Error saving assistant message:', assistantError);
        toast({
          title: 'Error guardando respuesta',
          description: assistantError.message,
          variant: 'destructive',
        });
        throw assistantError;
      }
      console.log('✅ Assistant response saved');

      // Refresh chat history
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      
      toast({
        title: 'Mensaje enviado',
        description: 'La respuesta de IA ha sido guardada',
      });

    } catch (error: any) {
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout');
        toast({
          title: 'Tiempo de espera agotado',
          description: 'La solicitud tardó demasiado. Por favor, intenta de nuevo.',
          variant: 'destructive',
        });
        return;
      }

      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    } finally {
      // Clean up timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
      
      toast({
        title: 'Historial borrado',
        description: 'Se ha eliminado el historial de chat',
      });
    } catch (error: any) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'No se pudo borrar el historial',
        variant: 'destructive',
      });
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
  };
};
